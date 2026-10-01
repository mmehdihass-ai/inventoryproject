"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productPayloadSchema, type ProductPayload } from "@/lib/validation/product";
import { parseImportRow } from "@/lib/validation/product-import";

type ActionResult = { error: string } | undefined;

function friendlyError(error: { code?: string; message: string }, sku: string) {
  if (error.code === "23505") {
    return `SKU "${sku}" is already in use.`;
  }
  return error.message;
}

export async function createProduct(
  payload: ProductPayload,
): Promise<ActionResult> {
  const parsed = productPayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(parsed);

  if (error) {
    return { error: friendlyError(error, parsed.sku) };
  }

  revalidatePath("/inventory");
  redirect(`/inventory/${parsed.id}`);
}

export async function updateProduct(
  payload: ProductPayload,
): Promise<ActionResult> {
  const parsed = productPayloadSchema.parse(payload);
  const { id, ...fields } = parsed;
  const supabase = await createClient();
  const { error } = await supabase.from("products").update(fields).eq("id", id);

  if (error) {
    return { error: friendlyError(error, parsed.sku) };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  redirect(`/inventory/${id}`);
}

export type ImportSummary = {
  created: number;
  updated: number;
  stockedIn: number;
  errors: { rowNumber: number; sku: string | null; message: string }[];
};

// Bulk import: inserts new products (by Item Number) or updates matching
// existing ones. Opening Stock only applies to a brand-new product — an
// existing one keeps its current ledger-derived stock untouched, so
// re-importing the same sheet to update prices never double-counts stock.
// Re-validates every row server-side; never trusts the client's parse.
export async function importProducts(
  rows: { rowNumber: number; raw: Record<string, unknown> }[],
): Promise<ImportSummary> {
  const supabase = await createClient();
  const summary: ImportSummary = {
    created: 0,
    updated: 0,
    stockedIn: 0,
    errors: [],
  };

  for (const { rowNumber, raw } of rows) {
    const parsed = parseImportRow(raw, rowNumber);
    if (!parsed.ok) {
      summary.errors.push({ rowNumber, sku: parsed.sku, message: parsed.error });
      continue;
    }

    const { data: existing, error: lookupError } = await supabase
      .from("products")
      .select("id")
      .eq("sku", parsed.sku)
      .maybeSingle();

    if (lookupError) {
      summary.errors.push({
        rowNumber,
        sku: parsed.sku,
        message: lookupError.message,
      });
      continue;
    }

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...fields } = parsed.payload;
      const { error } = await supabase
        .from("products")
        .update(fields)
        .eq("id", existing.id);
      if (error) {
        summary.errors.push({ rowNumber, sku: parsed.sku, message: error.message });
        continue;
      }
      summary.updated += 1;
      continue;
    }

    const { error: insertError } = await supabase
      .from("products")
      .insert(parsed.payload);
    if (insertError) {
      summary.errors.push({
        rowNumber,
        sku: parsed.sku,
        message: insertError.message,
      });
      continue;
    }
    summary.created += 1;

    if (parsed.openingStock) {
      const { error: stockError } = await supabase.rpc("fn_stock_in", {
        p_product_id: parsed.payload.id,
        p_quantity: parsed.openingStock,
        p_transaction_type: "OPENING_STOCK",
        p_transaction_date: new Date().toISOString().slice(0, 10),
      });
      if (stockError) {
        summary.errors.push({
          rowNumber,
          sku: parsed.sku,
          message: `Product created but opening stock failed: ${stockError.message}`,
        });
      } else {
        summary.stockedIn += 1;
      }
    }
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return summary;
}

// Soft delete only: inventory_transactions, sale_items, and return_items all
// reference products without cascade, so a real DELETE would either violate
// those foreign keys (if the product ever moved stock) or silently succeed
// only for brand-new products — an inconsistent, confusing distinction for
// the user. Marking it inactive + deleted keeps every past transaction,
// sale, and return intact and still attributable.
export async function deleteProduct(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { error: "A reason is required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      active: false,
      deleted_at: new Date().toISOString(),
      deletion_reason: trimmedReason,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}
