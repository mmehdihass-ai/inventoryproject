"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
    lines: sale.items.map((item) => ({
      product_id: item.product_id,
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
      discount: String(item.discount),
    })),
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

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const discount = Number(line.discount) || 0;
    return sum + (qty * price - discount);
  }, 0);
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const grandTotal = subtotal + taxAmount;

  async function onSubmit(values: EditSaleFormValues) {
    setFormError(null);
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
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(defaultValues(sale));
          setFormError(null);
        }
      }}
    >
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4" />
        Edit
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit invoice {sale.invoice_number}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale date" error={errors.sale_date?.message}>
              <Input type="date" {...register("sale_date")} />
            </Field>
            <Field
              label="Invoice number"
              error={errors.invoice_number?.message}
            >
              <Input {...register("invoice_number")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery note number">
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
                Add line
              </Button>
            </div>

            {fields.map((field, index) => {
              const selectedProduct = productFor(lines[index]?.product_id ?? "");
              const lineErrors = errors.lines?.[index];
              return (
                <div key={field.id} className="space-y-2 rounded-md border p-3">
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
                              if (
                                product?.selling_price != null &&
                                !lines[index]?.unit_price
                              ) {
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          Available: {formatQuantity(selectedProduct.stockPcs)}{" "}
                          PCS
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

                  <div className="grid grid-cols-3 gap-2">
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
                      label="Unit price"
                      error={lineErrors?.unit_price?.message}
                    >
                      <Input
                        inputMode="decimal"
                        {...register(`lines.${index}.unit_price`)}
                      />
                    </Field>
                    <Field
                      label="Discount"
                      error={lineErrors?.discount?.message}
                    >
                      <Input
                        inputMode="decimal"
                        {...register(`lines.${index}.discount`)}
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
              <span>Grand total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
