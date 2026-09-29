import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomerTable } from "@/components/customers/customer-table";
import { Pagination } from "@/components/ui/pagination";
import { listCustomersPaged } from "@/lib/queries/customers";

const PAGE_SIZE = 50;

export default async function CustomersPage(props: PageProps<"/customers">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const {
    rows: customers,
    totalCount,
    totalPages,
    page: currentPage,
  } = await listCustomersPaged(
    {
      search,
      active:
        status === "active" ? true : status === "inactive" ? false : undefined,
    },
    page,
    PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Customers</h1>
        <CustomerFormDialog />
      </div>

      <CustomerFilters />

      <CustomerTable customers={customers} />
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
