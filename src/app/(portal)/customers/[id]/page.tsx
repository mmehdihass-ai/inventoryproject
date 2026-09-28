import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { SalesTable } from "@/components/sales/sales-table";
import { getCustomerById } from "@/lib/queries/customers";
import { listSales } from "@/lib/queries/sales";
import { formatCurrency } from "@/lib/utils";

export default async function CustomerDetailPage(
  props: PageProps<"/customers/[id]">,
) {
  const { id } = await props.params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const sales = await listSales({ customerId: id });
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {customer.customer_name}
            </h1>
            <Badge variant={customer.active ? "secondary" : "outline"}>
              {customer.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {customer.contact_person && (
            <p className="text-muted-foreground">{customer.contact_person}</p>
          )}
        </div>
        <CustomerFormDialog customer={customer} />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          <Detail label="Phone" value={customer.phone ?? "—"} />
          <Detail label="Email" value={customer.email ?? "—"} />
          <Detail label="Address" value={customer.address ?? "—"} />
          <Detail label="Total sales" value={formatCurrency(totalSales)} />
        </CardContent>
      </Card>

      {customer.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Purchase history
        </h2>
        <SalesTable sales={sales} showCustomer={false} />
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Returns arrive in Phase 5.
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
