import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types/customer";

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
