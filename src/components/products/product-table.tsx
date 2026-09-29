import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity, formatNumber } from "@/lib/utils";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import type { ProductWithStock } from "@/lib/queries/products";

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
            <TableHead>No.</TableHead>
            <TableHead>Item Number</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Size/Dimension</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Product Category</TableHead>
            <TableHead className="text-right">Qty in Stock</TableHead>
            <TableHead className="text-right">Qty Available</TableHead>
            <TableHead className="text-right">PCS/CTN</TableHead>
            <TableHead className="text-right">KG/CTN</TableHead>
            <TableHead className="text-right">KG/Pallet</TableHead>
            <TableHead className="text-right">SQM/CTN</TableHead>
            <TableHead className="text-right">Balance SQM</TableHead>
            <TableHead className="text-right">Balance Box</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id}>
              <TableCell className="text-muted-foreground">
                {index + 1}
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
                {product.size_specification ?? "—"}
              </TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell>{product.category ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatQuantity(product.stockPcs)}
              </TableCell>
              <TableCell className="text-right">
                {formatQuantity(product.stockPcs)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatNumber(product.pcs_per_carton)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatNumber(product.kg_per_carton)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatNumber(product.kg_per_pallet)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatNumber(product.sqm_per_carton)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatQuantity(product.stockSqm)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatQuantity(product.stockCarton)}
              </TableCell>
              <TableCell>
                <DeleteProductDialog
                  productId={product.id}
                  productLabel={product.sku}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
