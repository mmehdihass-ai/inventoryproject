import { NextResponse, type NextRequest } from "next/server";
import { listProducts } from "@/lib/queries/products";
import { listCustomers } from "@/lib/queries/customers";
import { listSales } from "@/lib/queries/sales";

export const dynamic = "force-dynamic";

export type SearchResultItem = { id: string; label: string };
export type SearchResponse = {
  products: SearchResultItem[];
  customers: SearchResultItem[];
  sales: SearchResultItem[];
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json<SearchResponse>({
      products: [],
      customers: [],
      sales: [],
    });
  }

  let products, customers, sales;
  try {
    [products, customers, sales] = await Promise.all([
      listProducts({ search: q }),
      listCustomers({ search: q }),
      listSales({ search: q }),
    ]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response: SearchResponse = {
    products: products
      .slice(0, 5)
      .map((p) => ({ id: p.id, label: `${p.sku} — ${p.description}` })),
    customers: customers
      .slice(0, 5)
      .map((c) => ({ id: c.id, label: c.customer_name })),
    sales: sales.slice(0, 5).map((s) => ({
      id: s.id,
      label: s.customer
        ? `${s.invoice_number} — ${s.customer.customer_name}`
        : s.invoice_number,
    })),
  };

  return NextResponse.json(response);
}
