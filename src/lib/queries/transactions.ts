import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LedgerEntry, TransactionType } from "@/lib/types/transaction";
import type { Product } from "@/lib/types/product";
import type { Customer } from "@/lib/types/customer";

export async function listProductLedger(
  productId: string,
): Promise<LedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_transaction_ledger")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type TransactionListFilters = {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  productId?: string;
  category?: string;
  customerId?: string;
  reference?: string;
};

export type TransactionListRow = LedgerEntry & {
  product: Pick<Product, "id" | "sku" | "description" | "category"> | null;
  customer: Pick<Customer, "customer_name"> | null;
};

// Always reads the running balance from the unfiltered ledger view first —
// filters narrow which rows are *shown*, never how the balance itself was
// computed, so it stays correct regardless of the active filter set.
export async function listTransactions(
  filters: TransactionListFilters = {},
  limit = 300,
): Promise<TransactionListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("product_transaction_ledger")
    .select(
      "*, product:products!inner(id, sku, description, category), customer:customers(customer_name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.dateFrom) query = query.gte("transaction_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("transaction_date", filters.dateTo);
  if (filters.type) query = query.eq("transaction_type", filters.type);
  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.category) query = query.eq("product.category", filters.category);
  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters.reference) {
    query = query.ilike("reference_number", `%${filters.reference}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as TransactionListRow[];
}
