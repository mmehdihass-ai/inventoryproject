import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { formatCurrency } from "@/lib/utils";
import type { SaleListRow } from "@/lib/queries/sales";

export function SalesReport({ sales }: { sales: SaleListRow[] }) {
  const total = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const csvRows = sales.map((s) => ({
    Date: s.sale_date,
    Invoice: s.invoice_number,
    "Delivery Note": s.delivery_note_number ?? "",
    Customer: s.customer?.customer_name ?? "",
    Discount: s.discount_total,
    Total: s.total_amount,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sales.length} sales · {formatCurrency(total)} total
        </p>
        <ExportButtons rows={csvRows} filename="sales" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Delivery note</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.sale_date}</TableCell>
                <TableCell className="font-medium">
                  {s.invoice_number}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.delivery_note_number ?? "—"}
                </TableCell>
                <TableCell>{s.customer?.customer_name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(s.discount_total)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(s.total_amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
