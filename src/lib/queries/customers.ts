import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types/customer";
import type { PagedResult } from "@/lib/pagination";

export type CustomerListFilters = {
  search?: string;
  active?: boolean;
};

export async function listCustomers(
  filters: CustomerListFilters = {},
): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase.from("customers").select("*").order("customer_name");

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  if (filters.active !== undefined) {
    query = query.eq("active", filters.active);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// The Customers list page's dedicated paginated entry point.
export async function listCustomersPaged(
  filters: CustomerListFilters = {},
  page = 1,
  pageSize = 50,
): Promise<PagedResult<Customer>> {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .order("customer_name");

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  if (filters.active !== undefined) {
    query = query.eq("active", filters.active);
  }

  const requestedPage = Math.max(1, page);
  const from = (requestedPage - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    rows: data ?? [],
    page: Math.min(requestedPage, totalPages),
    pageSize,
    totalCount,
    totalPages,
  };
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
