import { Undo2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ReturnsFilters } from "@/components/returns/returns-filters";
import { ReturnsTable } from "@/components/returns/returns-table";
import { ReturnDialog } from "@/components/returns/return-dialog";
import { listReturns } from "@/lib/queries/returns";
import { listCustomers } from "@/lib/queries/customers";
import { listProductsWithStock } from "@/lib/queries/products";
import { listSalesForPicker } from "@/lib/queries/sales";

export default async function ReturnsPage(props: PageProps<"/returns">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const customerId =
    typeof searchParams.customer === "string"
      ? searchParams.customer
      : undefined;

  const [returns, customers, products, sales] = await Promise.all([
    listReturns({ search, customerId }),
    listCustomers(),
    listProductsWithStock({ active: true }),
    listSalesForPicker(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Returns
        </h1>
        <ReturnDialog
          customers={customers}
          sales={sales}
          products={products}
          triggerClassName={buttonVariants({ size: "sm" })}
          trigger={
            <>
              <Undo2 className="h-4 w-4" />
              Return
            </>
          }
        />
      </div>
      <ReturnsFilters customers={customers} />
      <ReturnsTable returns={returns} />
    </div>
  );
}
