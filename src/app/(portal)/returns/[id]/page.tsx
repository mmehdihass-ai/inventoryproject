import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getReturnById } from "@/lib/queries/returns";
import { formatCurrency, formatQuantity } from "@/lib/utils";

export default async function ReturnDetailPage(
  props: PageProps<"/returns/[id]">,
) {
  const { id } = await props.params;
  const ret = await getReturnById(id);

  if (!ret) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {ret.return_reference}
        </h1>
        <p className="text-muted-foreground">
          {ret.return_date} ·{" "}
          {ret.customer ? (
            <Link
              href={`/customers/${ret.customer.id}`}
              className="hover:underline"
            >
              {ret.customer.customer_name}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          <Detail
            label="Original invoice"
            value={ret.original_sale?.invoice_number ?? "—"}
          />
          <Detail label="Reason" value={ret.reason ?? "—"} />
          <Detail
            label="Refund amount"
            value={formatCurrency(ret.refund_amount)}
          />
        </CardContent>
      </Card>

      {ret.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{ret.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Items
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Restocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ret.items.map((item) => (
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
                  <TableCell>
                    <Badge variant={item.restock ? "secondary" : "outline"}>
                      {item.restock ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/returns" />}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Returns
      </Button>
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
