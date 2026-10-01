"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  editSaleFormSchema,
  paymentFormSchema,
  saleFormSchema,
  type EditSaleFormValues,
  type PaymentFormValues,
  type SaleFormValues,
} from "@/lib/validation/sale";

type ActionResult = { error: string } | undefined;
type CreateSaleResult = { error: string } | { id: string };

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
): Promise<CreateSaleResult> {
  const parsed = saleFormSchema.parse(values);
  const supabase = await createClient();

  const lines = parsed.lines.map((line) => ({
    product_id: line.product_id,
    quantity: Number(line.quantity),
    unit_price: Number(line.unit_price),
    discount: line.discount.trim() === "" ? 0 : Number(line.discount),
  }));

  const { data, error } = await supabase.rpc("fn_record_sale", {
    p_customer_name: parsed.customer_name.trim(),
    p_sale_date: parsed.sale_date,
    p_invoice_number: parsed.invoice_number.trim(),
    p_delivery_note_number: toNullable(parsed.delivery_note_number),
    p_notes: toNullable(parsed.notes),
    p_lines: lines,
    p_customer_contact_person: toNullable(parsed.customer_contact_person),
    p_customer_phone: toNullable(parsed.customer_phone),
    p_customer_email: toNullable(parsed.customer_email),
    p_customer_address: toNullable(parsed.customer_address),
    p_tax_percent:
      parsed.tax_percent.trim() === "" ? 0 : Number(parsed.tax_percent),
    p_advance_amount:
      parsed.advance_amount.trim() === ""
        ? null
        : Number(parsed.advance_amount),
    p_advance_payment_method: toNullable(parsed.advance_payment_method),
    p_advance_paid_on: parsed.sale_date,
  });

  if (error) {
    return { error: friendlyError(error, parsed.invoice_number) };
  }

  revalidatePath("/inventory");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/customers");
  return { id: data.id };
}

export async function updateSale(
  saleId: string,
  values: EditSaleFormValues,
): Promise<ActionResult> {
  const parsed = editSaleFormSchema.parse(values);
  const supabase = await createClient();

  const lines = parsed.lines.map((line) => ({
    product_id: line.product_id,
    quantity: Number(line.quantity),
    unit_price: Number(line.unit_price),
    discount: line.discount.trim() === "" ? 0 : Number(line.discount),
  }));

  const { error } = await supabase.rpc("fn_update_sale", {
    p_sale_id: saleId,
    p_sale_date: parsed.sale_date,
    p_invoice_number: parsed.invoice_number.trim(),
    p_delivery_note_number: toNullable(parsed.delivery_note_number),
    p_tax_percent: parsed.tax_percent.trim() === "" ? 0 : Number(parsed.tax_percent),
    p_notes: toNullable(parsed.notes),
    p_lines: lines,
  });

  if (error) {
    return { error: friendlyError(error, parsed.invoice_number) };
  }

  revalidatePath("/inventory");
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath(`/invoices/${saleId}`);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function recordPayment(
  saleId: string,
  values: PaymentFormValues,
): Promise<ActionResult> {
  const parsed = paymentFormSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.from("payments").insert({
    sale_id: saleId,
    amount: Number(parsed.amount),
    payment_method: toNullable(parsed.payment_method),
    paid_on: parsed.paid_on,
    notes: toNullable(parsed.notes),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath(`/invoices/${saleId}`);
}
