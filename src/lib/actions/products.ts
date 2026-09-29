"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productPayloadSchema, type ProductPayload } from "@/lib/validation/product";

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
