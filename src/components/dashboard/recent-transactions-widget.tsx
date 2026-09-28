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
import type { RecentTransactionRow } from "@/lib/queries/dashboard";

function linkFor(row: RecentTransactionRow): string {
  if (row.sale_id) return `/sales/${row.sale_id}`;
  if (row.return_id) return `/returns/${row.return_id}`;
  if (row.product) return `/inventory/${row.product.id}`;
  return "/transactions";
}

export function RecentTransactionsWidget({
  transactions,
}: {
  transactions: RecentTransactionRow[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No transactions yet.
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
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.transaction_date}</TableCell>
              <TableCell>
                {TRANSACTION_TYPE_LABELS[row.transaction_type]}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link href={linkFor(row)} className="hover:underline">
                  {row.reference_number ?? "—"}
                </Link>
              </TableCell>
              <TableCell>{row.customer?.customer_name ?? "—"}</TableCell>
              <TableCell>
                {row.product
                  ? `${row.product.sku} — ${row.product.description}`
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.quantity > 0 ? "+" : ""}
                {formatQuantity(row.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
