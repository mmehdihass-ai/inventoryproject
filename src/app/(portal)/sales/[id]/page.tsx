import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";
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
import { InvoiceStatusBadge } from "@/components/sales/invoice-status-badge";
import { RecordPaymentDialog } from "@/components/sales/record-payment-dialog";
import { getSaleById } from "@/lib/queries/sales";
import { listPaymentsForSale } from "@/lib/queries/payments";
import { formatCurrency, formatQuantity } from "@/lib/utils";

export default async function SaleDetailPage(
  props: PageProps<"/sales/[id]">,
) {
  const { id } = await props.params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  const payments = await listPaymentsForSale(id);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = sale.grand_total - paidTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Invoice {sale.invoice_number}
            </h1>
            <InvoiceStatusBadge
              grandTotal={sale.grand_total}
              paidTotal={paidTotal}
            />
          </div>
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/invoices/${sale.id}`} target="_blank" />}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`/api/invoices/${sale.id}/pdf`} download />}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          <Detail
            label="Delivery note"
            value={sale.delivery_note_number ?? "—"}
          />
          <Detail
            label="Discount total"
            value={formatCurrency(sale.discount_total)}
          />
          <Detail label="Subtotal" value={formatCurrency(sale.total_amount)} />
          <Detail
            label={`Tax (${formatQuantity(sale.tax_percent)}%)`}
            value={formatCurrency(sale.tax_amount)}
          />
          <Detail
            label="Grand total"
            value={formatCurrency(sale.grand_total)}
          />
          <Detail label="Balance due" value={formatCurrency(balanceDue)} />
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
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Products
        </h2>
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Payments
          </h2>
          <RecordPaymentDialog
            saleId={sale.id}
            invoiceNumber={sale.invoice_number}
            balanceDue={balanceDue}
          />
        </div>
        {payments.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Paid on</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, index) => (
                  <TableRow key={payment.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.payment_method || "—"}
                    </TableCell>
                    <TableCell>{payment.paid_on}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/sales" />}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sales
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
