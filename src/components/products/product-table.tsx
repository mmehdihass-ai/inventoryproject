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
import type { Product } from "@/lib/types/product";

export function ProductTable({ products }: { products: Product[] }) {
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
            <TableHead>Unit</TableHead>
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
              <TableCell>{product.unit}</TableCell>
              <TableCell>
                <Badge variant={product.active ? "secondary" : "outline"}>
                  {product.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
