import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaleRow } from "@/components/sales/sale-row";
import type { SaleListRow } from "@/lib/queries/sales";
import type { Payment } from "@/lib/types/sale";

export function SalesTable({
  sales,
  paymentsBySale,
  showCustomer = true,
}: {
  sales: SaleListRow[];
  paymentsBySale: Record<string, Payment[]>;
  showCustomer?: boolean;
}) {
  if (sales.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No sales match these filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Date</TableHead>
            <TableHead>Invoice</TableHead>
            {showCustomer && <TableHead>Customer</TableHead>}
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <SaleRow
              key={sale.id}
              sale={sale}
              payments={paymentsBySale[sale.id] ?? []}
              showCustomer={showCustomer}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
