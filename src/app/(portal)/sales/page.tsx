import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesTable } from "@/components/sales/sales-table";
import { NewSaleSheet } from "@/components/sales/new-sale-sheet";
import { listSales } from "@/lib/queries/sales";
import { listCustomers } from "@/lib/queries/customers";
import { listProductsWithStock } from "@/lib/queries/products";

export default async function SalesPage(props: PageProps<"/sales">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const customerId =
    typeof searchParams.customer === "string"
      ? searchParams.customer
      : undefined;

  const [sales, customers, products] = await Promise.all([
    listSales({ search, customerId }),
    listCustomers(),
    listProductsWithStock({ active: true }),
  ]);

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
      <SalesTable sales={sales} />
    </div>
  );
}
