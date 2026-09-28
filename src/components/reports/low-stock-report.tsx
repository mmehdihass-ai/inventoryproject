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
import { ExportButtons } from "@/components/reports/export-buttons";
import { STOCK_STATUS_LABELS } from "@/lib/inventory";
import { formatQuantity, formatNumber } from "@/lib/utils";
import type { ProductWithStock } from "@/lib/queries/products";

const STOCK_STATUS_VARIANT = {
  IN_STOCK: "secondary",
  LOW_STOCK: "outline",
  OUT_OF_STOCK: "destructive",
} as const;

export function LowStockReport({ products }: { products: ProductWithStock[] }) {
  const csvRows = products.map((p) => ({
    "Item No": p.sku,
    Description: p.description,
    Category: p.category ?? "",
    "Stock PCS": p.stockPcs,
    "Reorder Level": p.reorder_level,
    Status: STOCK_STATUS_LABELS[p.stockStatus],
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} products at or below reorder level
        </p>
        <ExportButtons rows={csvRows} filename="low-stock" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Stock PCS</TableHead>
              <TableHead className="text-right">Reorder level</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/inventory/${p.id}`} className="hover:underline">
                    {p.sku}
                  </Link>
                </TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell className="text-right">
                  {formatQuantity(p.stockPcs)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(p.reorder_level)}
                </TableCell>
                <TableCell>
                  <Badge variant={STOCK_STATUS_VARIANT[p.stockStatus]}>
                    {STOCK_STATUS_LABELS[p.stockStatus]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
