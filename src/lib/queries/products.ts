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

export type ProductSortKey =
  | "vendor_name"
  | "sku"
  | "description"
  | "size_specification"
  | "unit"
  | "category"
  | "stock"
  | "pcs_per_carton"
  | "kg_per_carton"
  | "kg_per_pallet"
  | "sqm_per_carton"
  | "balance_sqm"
  | "balance_box";

const SORT_ACCESSORS: Record<
  ProductSortKey,
  (p: ProductWithStock) => string | number | null
> = {
  vendor_name: (p) => p.vendor_name,
  sku: (p) => p.sku,
  description: (p) => p.description,
  size_specification: (p) => p.size_specification,
  unit: (p) => p.unit,
  category: (p) => p.category,
  stock: (p) => p.stockPcs,
  pcs_per_carton: (p) => p.pcs_per_carton,
  kg_per_carton: (p) => p.kg_per_carton,
  kg_per_pallet: (p) => p.kg_per_pallet,
  sqm_per_carton: (p) => p.sqm_per_carton,
  balance_sqm: (p) => p.stockSqm,
  balance_box: (p) => p.stockCarton,
};

// Nulls always sort last, regardless of direction — a product missing a
// conversion factor (e.g. no SQM/CTN) shouldn't jump to the top on desc.
function sortProducts(
  products: ProductWithStock[],
  sortBy: ProductSortKey,
  dir: "asc" | "desc",
): ProductWithStock[] {
  const accessor = SORT_ACCESSORS[sortBy];
  if (!accessor) return products;
  const sign = dir === "desc" ? -1 : 1;

  return [...products].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return sign * av.localeCompare(bv);
    }
    return sign * ((av as number) - (bv as number));
  });
}

// The Inventory list page's dedicated paginated entry point. Everything
// else (pickers, dashboard, reports) keeps calling listProductsWithStock
// directly and gets the full matching set — stock status is a derived,
// in-memory filter (see above), so it has to run before pagination slices
// the result, not as a query-level LIMIT/OFFSET. Sorting happens here for
// the same reason: several sortable columns (stock, Balance SQM/Box) are
// derived values, not plain DB columns.
export async function listProductsWithStockPaged(
  filters: ProductListFilters & { stockStatus?: StockStatus } = {},
  page = 1,
  pageSize = 50,
  sort?: { key: ProductSortKey; dir: "asc" | "desc" },
): Promise<PagedResult<ProductWithStock>> {
  const all = await listProductsWithStock(filters);
  const sorted = sort ? sortProducts(all, sort.key, sort.dir) : all;
  return paginate(sorted, page, pageSize);
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
