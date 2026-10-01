import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@/lib/types/sale";

export async function listPaymentsForSale(saleId: string): Promise<Payment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("sale_id", saleId)
    .order("paid_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export type SalePaymentTotal = { sale_id: string; paid_total: number };

export async function listPaidTotalsForSales(
  saleIds: string[],
): Promise<Record<string, number>> {
  if (saleIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_payment_totals")
    .select("sale_id, paid_total")
    .in("sale_id", saleIds);

  if (error) throw error;
  const result: Record<string, number> = {};
  for (const row of data as SalePaymentTotal[]) {
    result[row.sale_id] = row.paid_total;
  }
  return result;
}

export async function listPaymentsForSales(
  saleIds: string[],
): Promise<Record<string, Payment[]>> {
  if (saleIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .in("sale_id", saleIds)
    .order("paid_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  const result: Record<string, Payment[]> = {};
  for (const payment of data as Payment[]) {
    (result[payment.sale_id] ??= []).push(payment);
  }
  return result;
}
