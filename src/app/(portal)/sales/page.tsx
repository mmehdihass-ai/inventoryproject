import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesTable } from "@/components/sales/sales-table";
import { Pagination } from "@/components/ui/pagination";
import { NewSaleSheet } from "@/components/sales/new-sale-sheet";
import { listSalesPaged } from "@/lib/queries/sales";
import { listCustomers } from "@/lib/queries/customers";
import { listProductsWithStock } from "@/lib/queries/products";
import { listPaymentsForSales } from "@/lib/queries/payments";

const PAGE_SIZE = 50;

export default async function SalesPage(props: PageProps<"/sales">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const customerId =
    typeof searchParams.customer === "string"
      ? searchParams.customer
      : undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [
    { rows: sales, totalCount, totalPages, page: currentPage },
    customers,
    products,
  ] = await Promise.all([
    listSalesPaged({ search, customerId }, page, PAGE_SIZE),
    listCustomers(),
    listProductsWithStock({ active: true }),
  ]);
  const paymentsBySale = await listPaymentsForSales(sales.map((s) => s.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Sales
        </h1>
        <NewSaleSheet
          products={products}
          customers={customers}
          triggerClassName={buttonVariants({ size: "sm" })}
          trigger={
            <>
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </>
          }
        />
      </div>
      <SalesFilters customers={customers} />
      <SalesTable sales={sales} paymentsBySale={paymentsBySale} />
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
