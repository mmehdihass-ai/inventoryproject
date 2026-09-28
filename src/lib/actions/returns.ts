"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { returnFormSchema, type ReturnFormValues } from "@/lib/validation/return";

type ActionResult = { error: string } | { success: true; id: string };

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export async function createReturn(
  values: ReturnFormValues,
): Promise<ActionResult> {
  const parsed = returnFormSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("fn_record_return", {
    p_customer_id: parsed.customer_id,
    p_original_sale_id: toNullable(parsed.original_sale_id),
    p_sale_item_id: toNullable(parsed.sale_item_id),
    p_product_id: parsed.product_id,
    p_quantity: Number(parsed.quantity),
    p_return_date: parsed.return_date,
    p_reason: parsed.reason,
    p_restock: parsed.restock,
    p_refund_amount: toNullableNumber(parsed.refund_amount) ?? 0,
    p_notes: toNullable(parsed.notes),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath("/returns");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/customers");
  revalidatePath(`/customers/${parsed.customer_id}`);
  return { success: true, id: data.id };
}
