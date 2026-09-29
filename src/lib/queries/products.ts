import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/product";
import { computeStockConversions, type StockStatus } from "@/lib/inventory";
import { getCurrentStockMap } from "@/lib/queries/stock";
import { paginate, type PagedResult } from "@/lib/pagination";

export type ProductListFilters = {
  search?: string;
  category?: string;
  active?: boolean;
};

export type ProductWithStock = Product & {
  stockPcs: number;
  stockCarton: number | null;
  stockSqm: number | null;
  stockStatus: StockStatus;
};

export async function listProducts(
  filters: ProductListFilters = {},
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .order("description");

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

export async function listProductsWithStock(
  filters: ProductListFilters & { stockStatus?: StockStatus } = {},
): Promise<ProductWithStock[]> {
  const { stockStatus, ...productFilters } = filters;
  const [products, stockMap] = await Promise.all([
    listProducts(productFilters),
    getCurrentStockMap(),
  ]);

  const withStock = products.map((product) => {
    const stockPcs = stockMap.get(product.id) ?? 0;
    const conversions = computeStockConversions(product, stockPcs);
    return {
      ...product,
      stockPcs,
      stockCarton: conversions.stockCarton,
      stockSqm: conversions.stockSqm,
      stockStatus: conversions.status,
    };
  });

  if (stockStatus) {
    return withStock.filter((product) => product.stockStatus === stockStatus);
  }

  return withStock;
}

// The Inventory list page's dedicated paginated entry point. Everything
// else (pickers, dashboard, reports) keeps calling listProductsWithStock
// directly and gets the full matching set — stock status is a derived,
// in-memory filter (see above), so it has to run before pagination slices
// the result, not as a query-level LIMIT/OFFSET.
export async function listProductsWithStockPaged(
  filters: ProductListFilters & { stockStatus?: StockStatus } = {},
  page = 1,
  pageSize = 50,
): Promise<PagedResult<ProductWithStock>> {
  const all = await listProductsWithStock(filters);
  return paginate(all, page, pageSize);
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
    .is("deleted_at", null)
    .not("category", "is", null);

  if (error) throw error;
  const unique = new Set(
    data.map((row) => row.category).filter((c): c is string => Boolean(c)),
  );
  return Array.from(unique).sort();
}
