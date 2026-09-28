"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saleFormSchema, type SaleFormValues } from "@/lib/validation/sale";

type ActionResult = { error: string } | undefined;

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function friendlyError(error: { code?: string; message: string }, invoice: string) {
  if (error.code === "23505") {
    return `Invoice "${invoice}" is already in use.`;
  }
  return error.message;
}

export async function createSale(
  values: SaleFormValues,
): Promise<ActionResult> {
  const parsed = saleFormSchema.parse(values);
  const supabase = await createClient();

  const lines = parsed.lines.map((line) => ({
    product_id: line.product_id,
    quantity: Number(line.quantity),
    unit_price: Number(line.unit_price),
    discount: line.discount.trim() === "" ? 0 : Number(line.discount),
  }));

  const { data, error } = await supabase.rpc("fn_record_sale", {
    p_customer_id: parsed.customer_id,
    p_sale_date: parsed.sale_date,
    p_invoice_number: parsed.invoice_number.trim(),
    p_delivery_note_number: toNullable(parsed.delivery_note_number),
    p_notes: toNullable(parsed.notes),
    p_lines: lines,
  });

  if (error) {
    return { error: friendlyError(error, parsed.invoice_number) };
  }

  revalidatePath("/inventory");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/customers");
  redirect(`/sales/${data.id}`);
}
