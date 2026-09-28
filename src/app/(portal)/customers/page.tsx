import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomerTable } from "@/components/customers/customer-table";
import { listCustomers } from "@/lib/queries/customers";

export default async function CustomersPage(props: PageProps<"/customers">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  const customers = await listCustomers({
    search,
    active:
      status === "active" ? true : status === "inactive" ? false : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <CustomerFormDialog />
      </div>

      <CustomerFilters />

      <CustomerTable customers={customers} />
    </div>
  );
}
