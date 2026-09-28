import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { CustomerSalesRow } from "@/lib/queries/reports";

export function CustomerSalesReport({ rows }: { rows: CustomerSalesRow[] }) {
  const csvRows = rows.map((r) => ({
    Customer: r.customerName,
    "Sales Count": r.salesCount,
    "Total Amount": r.totalAmount,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} customers</p>
        <ExportButtons rows={csvRows} filename="customer-sales" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Sales count</TableHead>
              <TableHead className="text-right">Total amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.customerId}>
                <TableCell className="font-medium">
                  <Link
                    href={`/customers/${r.customerId}`}
                    className="hover:underline"
                  >
                    {r.customerName}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.salesCount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(r.totalAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
