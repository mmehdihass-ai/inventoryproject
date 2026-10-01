import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getProductById } from "@/lib/queries/products";
import { getCurrentStock } from "@/lib/queries/stock";
import { listProductLedger } from "@/lib/queries/transactions";
import { computeStockConversions, STOCK_STATUS_LABELS } from "@/lib/inventory";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types/transaction";
import { formatCurrency, formatNumber, formatQuantity } from "@/lib/utils";

const CONVERSION_FIELDS: Array<{
  key: "pcs_per_carton" | "kg_per_carton" | "kg_per_pallet" | "sqm_per_carton";
  label: string;
}> = [
  { key: "pcs_per_carton", label: "PCS/CTN" },
  { key: "kg_per_carton", label: "KG/CTN" },
  { key: "kg_per_pallet", label: "KG/Pallet" },
  { key: "sqm_per_carton", label: "SQM/CTN" },
];

const STOCK_STATUS_VARIANT = {
  IN_STOCK: "secondary",
  LOW_STOCK: "outline",
  OUT_OF_STOCK: "destructive",
} as const;

export default async function ProductDetailPage(
  props: PageProps<"/inventory/[id]">,
) {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const [stockPcs, ledger] = await Promise.all([
    getCurrentStock(id),
    listProductLedger(id),
  ]);

  const stock = computeStockConversions(product, stockPcs);
  const conversions = CONVERSION_FIELDS.filter(
    (field) => product[field.key] !== null,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ProductPhoto
            src={product.photo_url}
            alt={product.description}
            size={72}
          />
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {product.sku}
            </h1>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
          <Badge
            variant={
              product.deleted_at
                ? "destructive"
                : product.active
                  ? "secondary"
                  : "outline"
            }
          >
            {product.deleted_at
              ? "Deleted"
              : product.active
                ? "Active"
                : "Inactive"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/inventory/${product.id}/edit`} />}
        >
          <Pencil className="h-4 w-4" />
          Edit product
        </Button>
      </div>

      {product.deleted_at && (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">
              Deleted on {product.deleted_at.slice(0, 10)}
            </p>
            <p className="text-muted-foreground">
              Reason: {product.deletion_reason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6 pt-6">
              <div>
                <p className="text-xs text-muted-foreground">Current stock</p>
                <p className="font-heading text-2xl font-semibold tracking-tight">
                  {formatQuantity(stock.stockPcs)} PCS
                </p>
              </div>
              {stock.stockCarton !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Cartons</p>
                  <p className="text-lg font-medium">
                    {formatQuantity(stock.stockCarton)}
                  </p>
                </div>
              )}
              {stock.stockSqm !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">SQM</p>
                  <p className="text-lg font-medium">
                    {formatQuantity(stock.stockSqm)}
                  </p>
                </div>
              )}
              <Badge variant={STOCK_STATUS_VARIANT[stock.status]}>
                {STOCK_STATUS_LABELS[stock.status]}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
              <Detail
                label="Product Category"
                value={product.category ?? "—"}
              />
              <Detail
                label="Size/Dimension"
                value={product.size_specification ?? "—"}
              />
              <Detail label="Colour" value={product.colour ?? "—"} />
              <Detail
                label="Vendor Name"
                value={product.vendor_name ?? "—"}
              />
              <Detail
                label="Model Number"
                value={product.model_number ?? "—"}
              />
              <Detail label="Unit" value={product.unit} />
              <Detail
                label="Reorder Level"
                value={formatNumber(product.reorder_level)}
              />
              <Detail
                label="Cost Price"
                value={formatCurrency(product.cost_price)}
              />
              <Detail
                label="Selling Price"
                value={formatCurrency(product.selling_price)}
              />
            </CardContent>
          </Card>

          {conversions.length > 0 && (
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
                {conversions.map((field) => (
                  <Detail
                    key={field.key}
                    label={field.label}
                    value={formatNumber(product[field.key])}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {product.notes && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Transaction history
          </h2>
          {ledger.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.transaction_date}</TableCell>
                      <TableCell>
                        {TRANSACTION_TYPE_LABELS[entry.transaction_type]}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.reference_number ?? entry.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.quantity > 0 ? "+" : ""}
                        {formatQuantity(entry.quantity)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatQuantity(entry.running_balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/inventory" />}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
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
