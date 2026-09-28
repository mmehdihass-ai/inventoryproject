import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { STOCK_STATUS_LABELS } from "@/lib/inventory";
import { formatQuantity } from "@/lib/utils";
import type { ProductWithStock } from "@/lib/queries/products";

export function CurrentInventoryReport({
  products,
}: {
  products: ProductWithStock[];
}) {
  const csvRows = products.map((p) => ({
    "Item No": p.sku,
    Description: p.description,
    Category: p.category ?? "",
    Unit: p.unit,
    "Stock PCS": p.stockPcs,
    "Stock BOX": p.stockCarton ?? "",
    "Stock SQM": p.stockSqm ?? "",
    Status: STOCK_STATUS_LABELS[p.stockStatus],
    "Reorder Level": p.reorder_level,
    "Cost Price": p.cost_price ?? "",
    "Selling Price": p.selling_price ?? "",
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} products
        </p>
        <ExportCsvButton rows={csvRows} filename="current-inventory.csv" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock PCS</TableHead>
              <TableHead className="text-right">Stock BOX</TableHead>
              <TableHead className="text-right">Stock SQM</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.sku}</TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell>{p.category ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatQuantity(p.stockPcs)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatQuantity(p.stockCarton)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatQuantity(p.stockSqm)}
                </TableCell>
                <TableCell>{STOCK_STATUS_LABELS[p.stockStatus]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
