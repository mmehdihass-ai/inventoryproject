import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { SaleListRow } from "@/lib/queries/sales";

export function SalesTable({
  sales,
  showCustomer = true,
}: {
  sales: SaleListRow[];
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
            <TableHead>Date</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Delivery note</TableHead>
            {showCustomer && <TableHead>Customer</TableHead>}
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>{sale.sale_date}</TableCell>
              <TableCell className="font-medium">
                <Link href={`/sales/${sale.id}`} className="hover:underline">
                  {sale.invoice_number}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sale.delivery_note_number ?? "—"}
              </TableCell>
              {showCustomer && (
                <TableCell>{sale.customer?.customer_name ?? "—"}</TableCell>
              )}
              <TableCell className="text-right font-medium">
                {formatCurrency(sale.total_amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
