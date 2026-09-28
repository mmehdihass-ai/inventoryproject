import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductPhoto } from "@/components/products/product-photo";
import { getSaleById } from "@/lib/queries/sales";
import { formatCurrency, formatQuantity } from "@/lib/utils";

export default async function SaleDetailPage(
  props: PageProps<"/sales/[id]">,
) {
  const { id } = await props.params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Invoice {sale.invoice_number}
        </h1>
        <p className="text-muted-foreground">
          {sale.sale_date} ·{" "}
          {sale.customer ? (
            <Link
              href={`/customers/${sale.customer.id}`}
              className="hover:underline"
            >
              {sale.customer.customer_name}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          <Detail label="Delivery note" value={sale.delivery_note_number ?? "—"} />
          <Detail label="Discount total" value={formatCurrency(sale.discount_total)} />
          <Detail label="Sale total" value={formatCurrency(sale.total_amount)} />
        </CardContent>
      </Card>

      {sale.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{sale.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Products</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <ProductPhoto
                      src={item.product?.photo_url ?? null}
                      alt={item.product?.description ?? ""}
                    />
                  </TableCell>
                  <TableCell>
                    {item.product ? (
                      <Link
                        href={`/inventory/${item.product.id}`}
                        className="hover:underline"
                      >
                        {item.product.sku} — {item.product.description}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.discount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.line_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
