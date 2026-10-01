import "server-only";
import { getSaleById, type SaleDetail } from "@/lib/queries/sales";
import { listPaymentsForSale } from "@/lib/queries/payments";
import type { Payment } from "@/lib/types/sale";

export type InvoiceData = {
  sale: SaleDetail;
  payments: Payment[];
  paidTotal: number;
  balanceDue: number;
};

export async function getInvoiceData(id: string): Promise<InvoiceData | null> {
  const sale = await getSaleById(id);
  if (!sale) return null;

  const payments = await listPaymentsForSale(id);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = sale.grand_total - paidTotal;

  return { sale, payments, paidTotal, balanceDue };
}
