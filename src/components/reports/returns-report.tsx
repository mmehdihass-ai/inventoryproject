import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import type { ReturnListRow } from "@/lib/queries/returns";

export function ReturnsReport({ returns }: { returns: ReturnListRow[] }) {
  const csvRows = returns.map((r) => {
    const item = r.items[0];
    return {
      Date: r.return_date,
      Reference: r.return_reference,
      "Original Invoice": r.original_sale?.invoice_number ?? "",
      Customer: r.customer?.customer_name ?? "",
      Item: item?.product ? `${item.product.sku} — ${item.product.description}` : "",
      Quantity: item?.quantity ?? "",
      Restocked: item?.restock ? "Yes" : "No",
      Refund: r.refund_amount,
      Reason: r.reason ?? "",
    };
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{returns.length} returns</p>
        <ExportCsvButton rows={csvRows} filename="returns.csv" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Restocked</TableHead>
              <TableHead className="text-right">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((r) => {
              const item = r.items[0];
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.return_date}</TableCell>
                  <TableCell className="font-medium">
                    {r.return_reference}
                  </TableCell>
                  <TableCell>{r.customer?.customer_name ?? "—"}</TableCell>
                  <TableCell>
                    {item?.product
                      ? `${item.product.sku} — ${item.product.description}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item ? formatQuantity(item.quantity) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item?.restock ? "secondary" : "outline"}>
                      {item?.restock ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.refund_amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
