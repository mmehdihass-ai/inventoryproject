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
import { ProductPhoto } from "@/components/products/product-photo";
import { STOCK_STATUS_LABELS } from "@/lib/inventory";
import { formatQuantity } from "@/lib/utils";
import type { ProductWithStock } from "@/lib/queries/products";

const STOCK_STATUS_VARIANT = {
  IN_STOCK: "secondary",
  LOW_STOCK: "outline",
  OUT_OF_STOCK: "destructive",
} as const;

export function ProductTable({ products }: { products: ProductWithStock[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No products match these filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead>Item No.</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Specification</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Stock PCS</TableHead>
            <TableHead className="text-right">Stock BOX</TableHead>
            <TableHead className="text-right">Stock SQM</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <ProductPhoto
                  src={product.photo_url}
                  alt={product.description}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/inventory/${product.id}`}
                  className="hover:underline"
                >
                  {product.sku}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/inventory/${product.id}`}
                  className="hover:underline"
                >
                  {product.description}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[product.size_specification, product.colour]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </TableCell>
              <TableCell>{product.category ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatQuantity(product.stockPcs)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatQuantity(product.stockCarton)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatQuantity(product.stockSqm)}
              </TableCell>
              <TableCell>
                <Badge variant={STOCK_STATUS_VARIANT[product.stockStatus]}>
                  {STOCK_STATUS_LABELS[product.stockStatus]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
