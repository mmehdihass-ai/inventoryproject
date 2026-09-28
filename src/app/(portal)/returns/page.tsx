import { ReturnsFilters } from "@/components/returns/returns-filters";
import { ReturnsTable } from "@/components/returns/returns-table";
import { listReturns } from "@/lib/queries/returns";
import { listCustomers } from "@/lib/queries/customers";

export default async function ReturnsPage(props: PageProps<"/returns">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const customerId =
    typeof searchParams.customer === "string"
      ? searchParams.customer
      : undefined;

  const [returns, customers] = await Promise.all([
    listReturns({ search, customerId }),
    listCustomers(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Returns
      </h1>
      <ReturnsFilters customers={customers} />
      <ReturnsTable returns={returns} />
    </div>
  );
}
