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

// Returns which of the given Item Numbers already exist among non-deleted
// products. A soft-deleted product's Item Number is free for reuse (see
// migration 0014) — its own history stays intact under its own id either
// way, so it doesn't count as "existing" here.
export async function checkExistingSkus(skus: string[]): Promise<string[]> {
  if (skus.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .in("sku", skus)
    .is("deleted_at", null);

  if (error) throw error;
  return data.map((row) => row.sku);
}

export type ImportSummary = {
  created: number;
  skippedExisting: number;
  stockedIn: number;
  errors: { rowNumber: number; sku: string | null; message: string }[];
};

// Bulk import only ever creates new products. An Item Number that already
// exists is skipped entirely — field values and stock on an existing
// product are never touched by import; use Edit Product and Stock In/
// Adjustment for those. Re-validates every row server-side; never trusts
// the client's parse.
export async function importProducts(
  rows: { rowNumber: number; raw: Record<string, unknown> }[],
): Promise<ImportSummary> {
  const supabase = await createClient();
  const summary: ImportSummary = {
    created: 0,
    skippedExisting: 0,
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
      .is("deleted_at", null)
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
      summary.skippedExisting += 1;
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
