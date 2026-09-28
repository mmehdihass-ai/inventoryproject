"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  stockInFormSchema,
  adjustmentFormSchema,
  type StockInFormValues,
  type AdjustmentFormValues,
} from "@/lib/validation/transaction";

type ActionResult = { error: string } | { success: true };

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

function revalidateProductViews(productId: string) {
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function createStockIn(
  values: StockInFormValues,
): Promise<ActionResult> {
  const parsed = stockInFormSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.rpc("fn_stock_in", {
    p_product_id: parsed.product_id,
    p_quantity: Number(parsed.quantity),
    p_transaction_type: parsed.transaction_type,
    p_transaction_date: parsed.transaction_date,
    p_reference_number: toNullable(parsed.reference_number),
    p_supplier_name: toNullable(parsed.supplier_name),
    p_unit_cost: toNullableNumber(parsed.unit_cost),
    p_notes: toNullable(parsed.notes),
  });

  if (error) {
    return { error: error.message };
  }

  revalidateProductViews(parsed.product_id);
  return { success: true };
}

export async function createAdjustment(
  values: AdjustmentFormValues,
): Promise<ActionResult> {
  const parsed = adjustmentFormSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.rpc("fn_record_adjustment", {
    p_product_id: parsed.product_id,
    p_quantity: Number(parsed.quantity),
    p_direction: parsed.direction,
    p_transaction_date: parsed.transaction_date,
    p_reason: parsed.reason,
    p_notes: toNullable(parsed.notes),
  });

  if (error) {
    return { error: error.message };
  }

  revalidateProductViews(parsed.product_id);
  return { success: true };
}
