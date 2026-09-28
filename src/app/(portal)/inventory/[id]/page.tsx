import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductPhoto } from "@/components/products/product-photo";
import { getProductById } from "@/lib/queries/products";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CONVERSION_FIELDS: Array<{
  key: "pcs_per_carton" | "kg_per_carton" | "kg_per_pallet" | "sqm_per_carton";
  label: string;
}> = [
  { key: "pcs_per_carton", label: "PCS / carton" },
  { key: "kg_per_carton", label: "KG / carton" },
  { key: "kg_per_pallet", label: "KG / pallet" },
  { key: "sqm_per_carton", label: "SQM / carton" },
];

export default async function ProductDetailPage(
  props: PageProps<"/inventory/[id]">,
) {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const conversions = CONVERSION_FIELDS.filter(
    (field) => product[field.key] !== null,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ProductPhoto
            src={product.photo_url}
            alt={product.description}
            size={72}
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.sku}
            </h1>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
          <Badge variant={product.active ? "secondary" : "outline"}>
            {product.active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/inventory/${product.id}/edit`} />}
        >
          <Pencil className="h-4 w-4" />
          Edit product
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          <Detail label="Category" value={product.category ?? "—"} />
          <Detail
            label="Size / specification"
            value={product.size_specification ?? "—"}
          />
          <Detail label="Colour" value={product.colour ?? "—"} />
          <Detail label="Model number" value={product.model_number ?? "—"} />
          <Detail label="Unit" value={product.unit} />
          <Detail label="Reorder level" value={formatNumber(product.reorder_level)} />
          <Detail label="Cost price" value={formatCurrency(product.cost_price)} />
          <Detail
            label="Selling price"
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
            <p className="text-sm text-muted-foreground">{product.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Current inventory and transaction history arrive in Phase 3, once
          the transaction ledger is built.
        </CardContent>
      </Card>
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
