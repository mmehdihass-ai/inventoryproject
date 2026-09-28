import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types/transaction";
import { formatQuantity } from "@/lib/utils";
import type { TransactionListRow } from "@/lib/queries/transactions";

export function TransactionsTable({
  transactions,
}: {
  transactions: TransactionListRow[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No transactions match these filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Qty in</TableHead>
            <TableHead className="text-right">Qty out</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.transaction_date}</TableCell>
              <TableCell>{TRANSACTION_TYPE_LABELS[row.transaction_type]}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.reference_number ?? row.reason ?? "—"}
              </TableCell>
              <TableCell>
                {row.product ? (
                  <Link
                    href={`/inventory/${row.product.id}`}
                    className="hover:underline"
                  >
                    {row.product.sku} — {row.product.description}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{row.customer?.customer_name ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.quantity > 0 ? formatQuantity(row.quantity) : ""}
              </TableCell>
              <TableCell className="text-right">
                {row.quantity < 0 ? formatQuantity(Math.abs(row.quantity)) : ""}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatQuantity(row.running_balance)}
              </TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {row.notes ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
