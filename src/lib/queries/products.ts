import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/product";

export type ProductListFilters = {
  search?: string;
  category?: string;
  active?: boolean;
};

export async function listProducts(
  filters: ProductListFilters = {},
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("description");

  const search = filters.search?.trim().replace(/,/g, "");
  if (search) {
    query = query.or(
      `sku.ilike.%${search}%,description.ilike.%${search}%,model_number.ilike.%${search}%`,
    );
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.active !== undefined) {
    query = query.eq("active", filters.active);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .not("category", "is", null);

  if (error) throw error;
  const unique = new Set(
    data.map((row) => row.category).filter((c): c is string => Boolean(c)),
  );
  return Array.from(unique).sort();
}
