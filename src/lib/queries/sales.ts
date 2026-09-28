import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Sale, SaleItem } from "@/lib/types/sale";
import type { Product } from "@/lib/types/product";
import type { Customer } from "@/lib/types/customer";

export type SaleListRow = Sale & {
  customer: Pick<Customer, "id" | "customer_name"> | null;
};

export type SaleListFilters = {
  search?: string;
  customerId?: string;
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

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as SaleListRow[];
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
