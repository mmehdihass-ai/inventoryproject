"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field } from "@/components/ui/form-field";
import { updateSale } from "@/lib/actions/sales";
import {
  editSaleFormSchema,
  type EditSaleFormValues,
} from "@/lib/validation/sale";
import type { SaleDetail } from "@/lib/queries/sales";
import type { ProductWithStock } from "@/lib/queries/products";
import { formatCurrency, formatQuantity } from "@/lib/utils";

function defaultValues(sale: SaleDetail): EditSaleFormValues {
  return {
    sale_date: sale.sale_date,
    invoice_number: sale.invoice_number,
    delivery_note_number: sale.delivery_note_number ?? "",
    tax_percent: String(sale.tax_percent),
    notes: sale.notes ?? "",
    lines: sale.items.map((item) => {
      // sale_items.discount is stored as a flat amount; the form now takes
      // a percentage, so reconstruct the equivalent percent for editing.
      const base = item.quantity * item.unit_price;
      const discountPercent =
        base > 0 ? Math.round((item.discount / base) * 100 * 100) / 100 : 0;
      return {
        product_id: item.product_id,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        discount: String(discountPercent),
      };
    }),
  };
}

function emptyLine() {
  return { product_id: "", quantity: "", unit_price: "", discount: "" };
}

export function EditSaleDialog({
  sale,
  products,
}: {
  sale: SaleDetail;
  products: ProductWithStock[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditSaleFormValues>({
    resolver: zodResolver(editSaleFormSchema),
    defaultValues: defaultValues(sale),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const taxPercent = Number(watch("tax_percent")) || 0;

  // Active products for the picker, plus any product already on this sale
  // that's since been soft-deleted — otherwise its line would show a raw
  // UUID instead of a label (and couldn't be re-selected after removal).
  const extraProducts = sale.items
    .map((item) => item.product)
    .filter(
      (product): product is NonNullable<typeof product> =>
        product != null && !products.some((p) => p.id === product.id),
    )
    .map((product) => ({
      id: product.id,
      sku: product.sku,
      description: product.description,
      selling_price: null as number | null,
      stockPcs: null as number | null,
    }));

  const pickerProducts = [
    ...products.map((p) => ({
      id: p.id,
      sku: p.sku,
      description: p.description,
      selling_price: p.selling_price,
      stockPcs: p.stockPcs as number | null,
    })),
    ...extraProducts,
  ];

  const productItems = pickerProducts.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.description}`,
  }));

  function productFor(id: string) {
    return pickerProducts.find((p) => p.id === id);
  }

  // This sale's own original lines already consumed stock — saving puts
  // that quantity back before re-checking, so it counts toward what's
  // "available" for this edit.
  const originalQtyByProduct: Record<string, number> = {};
  for (const item of sale.items) {
    originalQtyByProduct[item.product_id] =
      (originalQtyByProduct[item.product_id] ?? 0) + item.quantity;
  }

  function availableFor(product: (typeof pickerProducts)[number]) {
    if (product.stockPcs == null) return null;
    return product.stockPcs + (originalQtyByProduct[product.id] ?? 0);
  }

  const requestedByProduct: Record<string, number> = {};
  for (const line of lines) {
    if (!line.product_id) continue;
    requestedByProduct[line.product_id] =
      (requestedByProduct[line.product_id] ?? 0) + (Number(line.quantity) || 0);
  }

  function sellPriceFor(unitPrice: number, discountPercent: number) {
    return unitPrice * (1 - discountPercent / 100);
  }

  function discountPercentFor(unitPrice: number, sellPrice: number) {
    if (unitPrice <= 0) return 0;
    const percent = (1 - sellPrice / unitPrice) * 100;
    return Math.round(Math.min(100, Math.max(0, percent)) * 100) / 100;
  }

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const discountPercent = Number(line.discount) || 0;
    return sum + qty * sellPriceFor(price, discountPercent);
  }, 0);
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const grandTotal = subtotal + taxAmount;

  function stockErrors(values: EditSaleFormValues): string | null {
    const requested: Record<string, number> = {};
    for (const line of values.lines) {
      if (!line.product_id) continue;
      requested[line.product_id] =
        (requested[line.product_id] ?? 0) + (Number(line.quantity) || 0);
    }
    for (const [productId, quantity] of Object.entries(requested)) {
      const product = productFor(productId);
      const available = product ? availableFor(product) : null;
      if (product && available != null && quantity > available) {
        return `${product.sku} — ${product.description}: requested ${formatQuantity(quantity)} PCS, only ${formatQuantity(available)} PCS available`;
      }
    }
    return null;
  }

  async function onSubmit(values: EditSaleFormValues) {
    setFormError(null);
    const stockError = stockErrors(values);
    if (stockError) {
      setFormError(stockError);
      return;
    }
    const result = await updateSale(sale.id, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    toast.success("Invoice updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(defaultValues(sale));
          setFormError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4" />
        Edit
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full flex-col overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice {sale.invoice_number}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale Date" error={errors.sale_date?.message}>
              <Input type="date" {...register("sale_date")} />
            </Field>
            <Field
              label="Invoice Number"
              error={errors.invoice_number?.message}
            >
              <Input {...register("invoice_number")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery Note Number">
              <Input {...register("delivery_note_number")} />
            </Field>
            <Field label="Tax %" error={errors.tax_percent?.message}>
              <Input inputMode="decimal" {...register("tax_percent")} />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Products</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyLine())}
              >
                <Plus className="h-4 w-4" />
                Add Line
              </Button>
            </div>

            {fields.map((field, index) => {
              const selectedProduct = productFor(
                lines[index]?.product_id ?? "",
              );
              const lineErrors = errors.lines?.[index];
              const available = selectedProduct
                ? availableFor(selectedProduct)
                : null;
              const requestedTotal = selectedProduct
                ? requestedByProduct[selectedProduct.id] ?? 0
                : 0;
              const exceedsStock =
                available != null && requestedTotal > available;
              const unitPrice = Number(lines[index]?.unit_price) || 0;
              const discountPercent = Number(lines[index]?.discount) || 0;
              const sellPrice = sellPriceFor(unitPrice, discountPercent);
              return (
                <div
                  key={field.id}
                  className="space-y-2 rounded-md border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Controller
                        control={control}
                        name={`lines.${index}.product_id`}
                        render={({ field: selectField }) => (
                          <SearchableSelect
                            items={productItems}
                            value={selectField.value}
                            onValueChange={(value) => {
                              selectField.onChange(value);
                              const product = productFor(value);
                              if (product?.selling_price != null) {
                                setValue(
                                  `lines.${index}.unit_price`,
                                  String(product.selling_price),
                                );
                              }
                            }}
                            placeholder="Search for a product..."
                          />
                        )}
                      />
                      {lineErrors?.product_id?.message && (
                        <p className="text-sm text-destructive">
                          {lineErrors.product_id.message}
                        </p>
                      )}
                      {selectedProduct && (
                        <p
                          className={`mt-1 text-xs ${exceedsStock ? "font-medium text-destructive" : "text-muted-foreground"}`}
                        >
                          Available: {formatQuantity(available)} PCS
                          {exceedsStock && " — exceeds available stock"}
                        </p>
                      )}
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <Field
                      label="Quantity"
                      error={lineErrors?.quantity?.message}
                    >
                      <Input
                        inputMode="decimal"
                        {...register(`lines.${index}.quantity`)}
                      />
                    </Field>
                    <Field
                      label="Unit Price"
                      error={lineErrors?.unit_price?.message}
                    >
                      <Input
                        inputMode="decimal"
                        {...register(`lines.${index}.unit_price`)}
                      />
                    </Field>
                    <Field
                      label="Discount %"
                      error={lineErrors?.discount?.message}
                    >
                      <Input
                        inputMode="decimal"
                        {...register(`lines.${index}.discount`)}
                      />
                    </Field>
                    <Field label="Sell Price">
                      <Input
                        inputMode="decimal"
                        value={String(Math.round(sellPrice * 100) / 100)}
                        onChange={(e) => {
                          const typed = Number(e.target.value);
                          if (!Number.isNaN(typed)) {
                            setValue(
                              `lines.${index}.discount`,
                              String(discountPercentFor(unitPrice, typed)),
                            );
                          }
                        }}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>

          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>

          <div className="space-y-1.5 border-t pt-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tax ({formatQuantity(taxPercent)}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
