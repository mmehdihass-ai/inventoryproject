import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types/transaction";
import { formatQuantity } from "@/lib/utils";
import type { TransactionListRow } from "@/lib/queries/transactions";

export function StockMovementReport({
  transactions,
}: {
  transactions: TransactionListRow[];
}) {
  const csvRows = transactions.map((t) => ({
    Date: t.transaction_date,
    Type: TRANSACTION_TYPE_LABELS[t.transaction_type],
    Reference: t.reference_number ?? t.reason ?? "",
    Product: t.product ? `${t.product.sku} — ${t.product.description}` : "",
    Customer: t.customer?.customer_name ?? "",
    "Qty In": t.quantity > 0 ? t.quantity : "",
    "Qty Out": t.quantity < 0 ? Math.abs(t.quantity) : "",
    Balance: t.running_balance,
    Notes: t.notes ?? "",
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {transactions.length} transactions
        </p>
        <ExportButtons rows={csvRows} filename="stock-movement" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty in</TableHead>
              <TableHead className="text-right">Qty out</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.transaction_date}</TableCell>
                <TableCell>
                  {TRANSACTION_TYPE_LABELS[t.transaction_type]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.reference_number ?? t.reason ?? "—"}
                </TableCell>
                <TableCell>
                  {t.product
                    ? `${t.product.sku} — ${t.product.description}`
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {t.quantity > 0 ? formatQuantity(t.quantity) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {t.quantity < 0 ? formatQuantity(Math.abs(t.quantity)) : ""}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatQuantity(t.running_balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
