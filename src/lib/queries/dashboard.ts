import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listProductsWithStock } from "@/lib/queries/products";
import type { TransactionType } from "@/lib/types/transaction";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(): string {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function daysAgo(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return isoDate(now);
}

export type DashboardKpis = {
  totalStockPcs: number;
  itemsSoldToday: number;
  itemsSoldThisMonth: number;
  salesToday: number;
  salesThisMonth: number;
};

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = await createClient();
  const today = isoDate(new Date());
  const monthStart = startOfMonth();

  const [products, todaySales, monthSales, todayItems, monthItems] =
    await Promise.all([
      listProductsWithStock({ active: true }),
      supabase.from("sales").select("total_amount").eq("sale_date", today),
      supabase
        .from("sales")
        .select("total_amount")
        .gte("sale_date", monthStart),
      supabase
        .from("sale_items")
        .select("quantity, sales!inner(sale_date)")
        .eq("sales.sale_date", today),
      supabase
        .from("sale_items")
        .select("quantity, sales!inner(sale_date)")
        .gte("sales.sale_date", monthStart),
    ]);

  const totalStockPcs = products.reduce((sum, p) => sum + p.stockPcs, 0);

  const salesToday = (todaySales.data ?? []).reduce(
    (sum, s) => sum + s.total_amount,
    0,
  );
  const salesThisMonth = (monthSales.data ?? []).reduce(
    (sum, s) => sum + s.total_amount,
    0,
  );

  const itemsSoldToday = (todayItems.data ?? []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const itemsSoldThisMonth = (monthItems.data ?? []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    totalStockPcs,
    itemsSoldToday,
    itemsSoldThisMonth,
    salesToday,
    salesThisMonth,
  };
}

export type SalesTrendPoint = { date: string; total: number };

export async function getSalesTrend(days = 30): Promise<SalesTrendPoint[]> {
  const supabase = await createClient();
  const cutoff = daysAgo(days - 1);

  const { data, error } = await supabase
    .from("sales")
    .select("sale_date, total_amount")
    .gte("sale_date", cutoff);

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data) {
    totals.set(row.sale_date, (totals.get(row.sale_date) ?? 0) + row.total_amount);
  }

  const points: SalesTrendPoint[] = [];
  const cursor = new Date(cutoff);
  const end = new Date();
  while (cursor <= end) {
    const key = isoDate(cursor);
    points.push({ date: key, total: totals.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export type CategoryStock = { category: string; stockPcs: number };

export async function getInventoryByCategory(): Promise<CategoryStock[]> {
  const products = await listProductsWithStock({ active: true });
  const totals = new Map<string, number>();
  for (const product of products) {
    const key = product.category ?? "Uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + product.stockPcs);
  }

  const sorted = Array.from(totals, ([category, stockPcs]) => ({
    category,
    stockPcs,
  })).sort((a, b) => b.stockPcs - a.stockPcs);

  if (sorted.length <= 8) return sorted;

  const top = sorted.slice(0, 7);
  const rest = sorted.slice(7).reduce((sum, row) => sum + row.stockPcs, 0);
  top.push({ category: "Other", stockPcs: rest });
  return top;
}

export type TopSellingProduct = {
  productId: string;
  label: string;
  quantitySold: number;
};

export async function getTopSellingProducts(
  days = 30,
  limit = 7,
): Promise<TopSellingProduct[]> {
  const supabase = await createClient();
  const cutoff = daysAgo(days - 1);

  const { data, error } = await supabase
    .from("sale_items")
    .select("product_id, quantity, sales!inner(sale_date), product:products(sku, description)")
    .gte("sales.sale_date", cutoff);

  if (error) throw error;

  const rows = data as unknown as Array<{
    product_id: string;
    quantity: number;
    product: { sku: string; description: string } | null;
  }>;

  const totals = new Map<string, { label: string; quantitySold: number }>();
  for (const row of rows) {
    const existing = totals.get(row.product_id);
    const label = row.product
      ? `${row.product.sku} — ${row.product.description}`
      : "Unknown product";
    if (existing) {
      existing.quantitySold += row.quantity;
    } else {
      totals.set(row.product_id, { label, quantitySold: row.quantity });
    }
  }

  return Array.from(totals, ([productId, value]) => ({
    productId,
    ...value,
  }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);
}

export type RecentTransactionRow = {
  id: string;
  created_at: string;
  transaction_date: string;
  transaction_type: TransactionType;
  reference_number: string | null;
  quantity: number;
  sale_id: string | null;
  return_id: string | null;
  product: { id: string; sku: string; description: string } | null;
  customer: { customer_name: string } | null;
};

export async function getRecentTransactions(
  limit = 10,
): Promise<RecentTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(
      "id, created_at, transaction_date, transaction_type, reference_number, quantity, sale_id, return_id, product:products(id, sku, description), customer:customers(customer_name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as RecentTransactionRow[];
}
