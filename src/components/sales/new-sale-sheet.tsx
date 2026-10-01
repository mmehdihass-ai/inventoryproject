"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
import { createSale } from "@/lib/actions/sales";
import { saleFormSchema, type SaleFormValues } from "@/lib/validation/sale";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import { DEFAULT_TAX_PERCENT } from "@/lib/company";

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
    customer_contact_person: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    invoice_number: "",
    delivery_note_number: "",
    tax_percent: String(DEFAULT_TAX_PERCENT),
    advance_amount: "",
    advance_payment_method: "",
    notes: "",
    lines: [emptyLine()],
  };
}

export function NewSaleSheet({
  products,
  customers,
  trigger,
  triggerClassName,
}: {
  products: ProductWithStock[];
  customers: Customer[];
  trigger: ReactNode;
  triggerClassName?: string;
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
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: defaultValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const customerName = watch("customer_name") ?? "";

  const matchedCustomer = customers.find(
    (customer) =>
      customer.customer_name.trim().toLowerCase() ===
      customerName.trim().toLowerCase(),
  );

  useEffect(() => {
    if (matchedCustomer) {
      setValue("customer_contact_person", matchedCustomer.contact_person ?? "");
      setValue("customer_phone", matchedCustomer.phone ?? "");
      setValue("customer_email", matchedCustomer.email ?? "");
      setValue("customer_address", matchedCustomer.address ?? "");
    } else {
      setValue("customer_contact_person", "");
      setValue("customer_phone", "");
      setValue("customer_email", "");
      setValue("customer_address", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCustomer?.id]);

  const productItems = products.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.description}`,
  }));

  function productFor(id: string) {
    return products.find((p) => p.id === id);
  }

  const taxPercent = Number(watch("tax_percent")) || 0;
  const advanceAmount = Number(watch("advance_amount")) || 0;

  // Total quantity requested per product across every line in this form —
  // two lines for the same product both need to fit within its stock.
  const requestedByProduct: Record<string, number> = {};
  for (const line of lines) {
    if (!line.product_id) continue;
    requestedByProduct[line.product_id] =
      (requestedByProduct[line.product_id] ?? 0) + (Number(line.quantity) || 0);
  }

  function sellPriceFor(unitPrice: number, discountPercent: number) {
    return unitPrice * (1 - discountPercent / 100);
  }

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const discountPercent = Number(line.discount) || 0;
    return sum + qty * sellPriceFor(price, discountPercent);
  }, 0);
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const grandTotal = subtotal + taxAmount;
  const balanceDue = grandTotal - advanceAmount;

  function stockErrors(values: SaleFormValues): string | null {
    const requested: Record<string, number> = {};
    for (const line of values.lines) {
      if (!line.product_id) continue;
      requested[line.product_id] =
        (requested[line.product_id] ?? 0) + (Number(line.quantity) || 0);
    }
    for (const [productId, quantity] of Object.entries(requested)) {
      const product = productFor(productId);
      if (product && quantity > product.stockPcs) {
        return `${product.sku} — ${product.description}: requested ${formatQuantity(quantity)} PCS, only ${formatQuantity(product.stockPcs)} PCS available`;
      }
    }
    return null;
  }

  async function onSubmit(values: SaleFormValues) {
    setFormError(null);
    const stockError = stockErrors(values);
    if (stockError) {
      setFormError(stockError);
      return;
    }
    const result = await createSale(values);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    toast.success("Sale saved");
    setOpen(false);
    reset(defaultValues());
    router.push(`/sales/${result.id}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(defaultValues());
          setFormError(null);
        }
      }}
    >
      <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full flex-col overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale Date" error={errors.sale_date?.message}>
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

          {customerName.trim() && matchedCustomer && (
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Contact Person</p>
                <p>{matchedCustomer.contact_person || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p>{matchedCustomer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{matchedCustomer.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p>{matchedCustomer.address || "—"}</p>
              </div>
            </div>
          )}

          {customerName.trim() && !matchedCustomer && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Person">
                <Input {...register("customer_contact_person")} />
              </Field>
              <Field label="Phone Number">
                <Input
                  type="tel"
                  {...register("customer_phone")}
                />
              </Field>
              <Field label="Email">
                <Input type="email" {...register("customer_email")} />
              </Field>
              <Field label="Address">
                <Input {...register("customer_address")} />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Invoice Number"
              error={errors.invoice_number?.message}
            >
              <Input {...register("invoice_number")} />
            </Field>
            <Field label="Delivery Note Number">
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
                Add Line
              </Button>
            </div>

            {fields.map((field, index) => {
              const selectedProduct = productFor(
                lines[index]?.product_id ?? "",
              );
              const lineErrors = errors.lines?.[index];
              const requestedTotal = selectedProduct
                ? requestedByProduct[selectedProduct.id] ?? 0
                : 0;
              const exceedsStock =
                selectedProduct != null &&
                requestedTotal > selectedProduct.stockPcs;
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
                          Available: {formatQuantity(selectedProduct.stockPcs)}{" "}
                          PCS
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
                        readOnly
                        disabled
                        value={formatCurrency(sellPrice)}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Tax %" error={errors.tax_percent?.message}>
              <Input inputMode="decimal" {...register("tax_percent")} />
            </Field>
            <Field
              label="Advance Payment"
              error={errors.advance_amount?.message}
            >
              <Input inputMode="decimal" {...register("advance_amount")} />
            </Field>
            <Field label="Payment Method">
              <Input
                placeholder="Cash, bank transfer..."
                {...register("advance_payment_method")}
              />
            </Field>
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
            {advanceAmount > 0 && (
              <>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Advance Paid</span>
                  <span>{formatCurrency(advanceAmount)}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Balance Due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </>
            )}
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
