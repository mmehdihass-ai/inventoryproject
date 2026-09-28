import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import type { ReturnListRow } from "@/lib/queries/returns";

export function ReturnsTable({
  returns,
  showCustomer = true,
}: {
  returns: ReturnListRow[];
  showCustomer?: boolean;
}) {
  if (returns.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No returns match these filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Original invoice</TableHead>
            {showCustomer && <TableHead>Customer</TableHead>}
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Restocked</TableHead>
            <TableHead className="text-right">Refund</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((ret) => {
            const item = ret.items[0];
            return (
              <TableRow key={ret.id}>
                <TableCell>{ret.return_date}</TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/returns/${ret.id}`}
                    className="hover:underline"
                  >
                    {ret.return_reference}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ret.original_sale?.invoice_number ?? "—"}
                </TableCell>
                {showCustomer && (
                  <TableCell>{ret.customer?.customer_name ?? "—"}</TableCell>
                )}
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
                  {formatCurrency(ret.refund_amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
