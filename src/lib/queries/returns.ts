import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Return, ReturnItem } from "@/lib/types/return";
import type { Customer } from "@/lib/types/customer";
import type { Sale } from "@/lib/types/sale";
import type { Product } from "@/lib/types/product";
import type { PagedResult } from "@/lib/pagination";

export type ReturnListRow = Return & {
  customer: Pick<Customer, "id" | "customer_name"> | null;
  original_sale: Pick<Sale, "id" | "invoice_number"> | null;
  items: Array<
    Pick<ReturnItem, "id" | "quantity" | "restock"> & {
      product: Pick<Product, "id" | "sku" | "description"> | null;
    }
  >;
};

export type ReturnListFilters = {
  search?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listReturns(
  filters: ReturnListFilters = {},
): Promise<ReturnListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("returns")
    .select(
      "*, customer:customers(id, customer_name), original_sale:sales(id, invoice_number), items:return_items(id, quantity, restock, product:products(id, sku, description))",
    )
    .order("return_date", { ascending: false })
    .order("created_at", { ascending: false });

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.ilike("return_reference", `%${search}%`);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.dateFrom) {
    query = query.gte("return_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("return_date", filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ReturnListRow[];
}

// The Returns list page's dedicated paginated entry point.
export async function listReturnsPaged(
  filters: ReturnListFilters = {},
  page = 1,
  pageSize = 50,
): Promise<PagedResult<ReturnListRow>> {
  const supabase = await createClient();
  let query = supabase
    .from("returns")
    .select(
      "*, customer:customers(id, customer_name), original_sale:sales(id, invoice_number), items:return_items(id, quantity, restock, product:products(id, sku, description))",
      { count: "exact" },
    )
    .order("return_date", { ascending: false })
    .order("created_at", { ascending: false });

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.ilike("return_reference", `%${search}%`);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.dateFrom) {
    query = query.gte("return_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("return_date", filters.dateTo);
  }

  const requestedPage = Math.max(1, page);
  const from = (requestedPage - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    rows: (data ?? []) as unknown as ReturnListRow[],
    page: Math.min(requestedPage, totalPages),
    pageSize,
    totalCount,
    totalPages,
  };
}

export type ReturnDetail = Return & {
  customer: Customer | null;
  original_sale: Pick<Sale, "id" | "invoice_number"> | null;
  items: Array<
    ReturnItem & {
      product: Pick<Product, "id" | "sku" | "description" | "photo_url"> | null;
    }
  >;
};

export async function getReturnById(id: string): Promise<ReturnDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("returns")
    .select(
      "*, customer:customers(*), original_sale:sales(id, invoice_number), items:return_items(*, product:products(id, sku, description, photo_url))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ReturnDetail | null;
}
