import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Sale, SaleItem } from "@/lib/types/sale";
import type { Product } from "@/lib/types/product";
import type { Customer } from "@/lib/types/customer";
import type { PagedResult } from "@/lib/pagination";

export type SaleListRow = Sale & {
  customer: Pick<Customer, "id" | "customer_name"> | null;
};

export type SaleListFilters = {
  search?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listSales(
  filters: SaleListFilters = {},
): Promise<SaleListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("sales")
    .select("*, customer:customers(id, customer_name)")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.or(
      `invoice_number.ilike.%${search}%,delivery_note_number.ilike.%${search}%`,
    );
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.dateFrom) {
    query = query.gte("sale_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("sale_date", filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as SaleListRow[];
}

// The Sales list page's dedicated paginated entry point — a real
// query-level LIMIT/OFFSET (via .range()), since sales rows need no
// derived post-filter the way product stock status does.
export async function listSalesPaged(
  filters: SaleListFilters = {},
  page = 1,
  pageSize = 50,
): Promise<PagedResult<SaleListRow>> {
  const supabase = await createClient();
  let query = supabase
    .from("sales")
    .select("*, customer:customers(id, customer_name)", { count: "exact" })
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.or(
      `invoice_number.ilike.%${search}%,delivery_note_number.ilike.%${search}%`,
    );
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.dateFrom) {
    query = query.gte("sale_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("sale_date", filters.dateTo);
  }

  const requestedPage = Math.max(1, page);
  const from = (requestedPage - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    rows: (data ?? []) as unknown as SaleListRow[],
    page: Math.min(requestedPage, totalPages),
    pageSize,
    totalCount,
    totalPages,
  };
}

export type SalePickerRow = Pick<
  Sale,
  "id" | "invoice_number" | "sale_date" | "customer_id"
>;

export async function listSalesForPicker(): Promise<SalePickerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("id, invoice_number, sale_date, customer_id")
    .order("sale_date", { ascending: false });

  if (error) throw error;
  return data;
}

export type SaleDetail = Sale & {
  customer: Customer | null;
  items: Array<
    SaleItem & {
      product: Pick<Product, "id" | "sku" | "description" | "photo_url"> | null;
    }
  >;
};

export async function getSaleById(id: string): Promise<SaleDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(
      "*, customer:customers(*), items:sale_items(*, product:products(id, sku, description, photo_url))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as SaleDetail | null;
}
