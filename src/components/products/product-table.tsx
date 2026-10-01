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
import { SortableColumnHead } from "@/components/ui/sortable-column-head";
import type { ProductWithStock } from "@/lib/queries/products";

export function ProductTable({
  products,
  startIndex = 0,
}: {
  products: ProductWithStock[];
  startIndex?: number;
}) {
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
            <SortableColumnHead sortKey="vendor_name">Vendor</SortableColumnHead>
            <SortableColumnHead sortKey="sku">Item Number</SortableColumnHead>
            <SortableColumnHead sortKey="description">
              Description
            </SortableColumnHead>
            <SortableColumnHead sortKey="size_specification">
              Size/Dimension
            </SortableColumnHead>
            <SortableColumnHead sortKey="unit">Unit</SortableColumnHead>
            <SortableColumnHead sortKey="category">
              Product Category
            </SortableColumnHead>
            <SortableColumnHead sortKey="stock" className="text-right">
              Qty in Stock
            </SortableColumnHead>
            <SortableColumnHead sortKey="stock" className="text-right">
              Qty Available
            </SortableColumnHead>
            <SortableColumnHead sortKey="pcs_per_carton" className="text-right">
              PCS/CTN
            </SortableColumnHead>
            <SortableColumnHead sortKey="kg_per_carton" className="text-right">
              KG/CTN
            </SortableColumnHead>
            <SortableColumnHead sortKey="kg_per_pallet" className="text-right">
              KG/Pallet
            </SortableColumnHead>
            <SortableColumnHead sortKey="sqm_per_carton" className="text-right">
              SQM/CTN
            </SortableColumnHead>
            <SortableColumnHead sortKey="balance_sqm" className="text-right">
              Balance SQM
            </SortableColumnHead>
            <SortableColumnHead sortKey="balance_box" className="text-right">
              Balance Box
            </SortableColumnHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id}>
              <TableCell className="text-muted-foreground">
                {startIndex + index + 1}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.vendor_name ?? "—"}
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
