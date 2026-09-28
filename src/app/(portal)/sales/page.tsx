import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesTable } from "@/components/sales/sales-table";
import { listSales } from "@/lib/queries/sales";
import { listCustomers } from "@/lib/queries/customers";

export default async function SalesPage(props: PageProps<"/sales">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const customerId =
    typeof searchParams.customer === "string"
      ? searchParams.customer
      : undefined;

  const [sales, customers] = await Promise.all([
    listSales({ search, customerId }),
    listCustomers(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Sales</h1>
      <SalesFilters customers={customers} />
      <SalesTable sales={sales} />
    </div>
  );
}
