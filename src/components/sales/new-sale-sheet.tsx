"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";

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
import { createSale } from "@/lib/actions/sales";
import { saleFormSchema, type SaleFormValues } from "@/lib/validation/sale";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";
import { formatCurrency, formatQuantity } from "@/lib/utils";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine() {
  return { product_id: "", quantity: "", unit_price: "", discount: "" };
}

function defaultValues(): SaleFormValues {
  return {
    sale_date: today(),
    customer_name: "",
    invoice_number: "",
    delivery_note_number: "",
    notes: "",
    lines: [emptyLine()],
  };
}

export function NewSaleSheet({
  products,
  customers,
}: {
  products: ProductWithStock[];
  customers: Customer[];
}) {
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
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: defaultValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const customerName = watch("customer_name");

  const matchedCustomer = customers.find(
    (customer) =>
      customer.customer_name.trim().toLowerCase() ===
      customerName.trim().toLowerCase(),
  );

  const productItems = products.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.description}`,
  }));

  function productFor(id: string) {
    return products.find((p) => p.id === id);
  }

  const saleTotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const discount = Number(line.discount) || 0;
    return sum + (qty * price - discount);
  }, 0);

  async function onSubmit(values: SaleFormValues) {
    setFormError(null);
    const result = await createSale(values);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(defaultValues());
          setFormError(null);
        }
      }}
    >
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <ShoppingCart className="h-4 w-4" />
        New Sale
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New sale</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale date" error={errors.sale_date?.message}>
              <Input type="date" {...register("sale_date")} />
            </Field>
            <Field label="Customer Name" error={errors.customer_name?.message}>
              <Input
                placeholder="Type a customer name..."
                autoComplete="off"
                {...register("customer_name")}
              />
              {customerName.trim() && (
                <p className="text-xs text-muted-foreground">
                  {matchedCustomer
                    ? `Existing customer: ${matchedCustomer.customer_name}`
                    : "New customer — will be added on save"}
                </p>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Invoice number"
              error={errors.invoice_number?.message}
            >
              <Input {...register("invoice_number")} />
            </Field>
            <Field label="Delivery note number">
              <Input
                placeholder="DN-00000"
                {...register("delivery_note_number")}
              />
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

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Sale total</span>
            <span className="text-lg font-semibold">
              {formatCurrency(saleTotal)}
            </span>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save sale"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
