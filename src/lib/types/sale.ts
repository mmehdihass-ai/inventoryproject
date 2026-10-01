export type Sale = {
  id: string;
  sale_date: string;
  customer_id: string;
  invoice_number: string;
  delivery_note_number: string | null;
  discount_total: number;
  total_amount: number;
  tax_percent: number;
  tax_amount: number;
  grand_total: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: string | null;
  paid_on: string;
  notes: string | null;
  created_at: string;
};

export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export function invoiceStatus(
  grandTotal: number,
  paidTotal: number,
): InvoiceStatus {
  if (paidTotal <= 0) return "UNPAID";
  if (paidTotal >= grandTotal) return "PAID";
  return "PARTIALLY_PAID";
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  created_at: string;
};
