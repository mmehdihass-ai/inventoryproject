import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { SalesTable } from "@/components/sales/sales-table";
import { ReturnsTable } from "@/components/returns/returns-table";
import { getCustomerById } from "@/lib/queries/customers";
import { listSales } from "@/lib/queries/sales";
import { listReturns } from "@/lib/queries/returns";
import { listPaymentsForSales } from "@/lib/queries/payments";
import { formatCurrency } from "@/lib/utils";

export default async function CustomerDetailPage(
  props: PageProps<"/customers/[id]">,
) {
  const { id } = await props.params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const [sales, returns] = await Promise.all([
    listSales({ customerId: id }),
    listReturns({ customerId: id }),
  ]);
  const paymentsBySale = await listPaymentsForSales(sales.map((s) => s.id));
  const totalSales = sales.reduce((sum, sale) => sum + sale.grand_total, 0);

  return (
    <div className="space-y-6">
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
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Purchase history
          </h2>
          <div className="max-h-[600px] overflow-y-auto rounded-md">
            <SalesTable
              sales={sales}
              paymentsBySale={paymentsBySale}
              showCustomer={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Returns
          </h2>
          <div className="max-h-[600px] overflow-y-auto rounded-md">
            <ReturnsTable returns={returns} showCustomer={false} />
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/customers" />}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Button>
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
