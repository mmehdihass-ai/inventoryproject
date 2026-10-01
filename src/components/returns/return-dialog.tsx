"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field } from "@/components/ui/form-field";
import { createReturn } from "@/lib/actions/returns";
import {
  returnFormSchema,
  type ReturnFormValues,
} from "@/lib/validation/return";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types/customer";
import type { SalePickerRow } from "@/lib/queries/sales";
import type { ProductWithStock } from "@/lib/queries/products";

type SaleItemOption = {
  saleItemId: string;
  productId: string;
  label: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(): ReturnFormValues {
  return {
    return_date: today(),
    customer_id: "",
    original_sale_id: "",
    sale_item_id: "",
    product_id: "",
    quantity: "",
    reason: "",
    restock: true,
    refund_amount: "",
    notes: "",
  };
}

export function ReturnDialog({
  customers,
  sales,
  products,
  trigger,
  triggerClassName,
}: {
  customers: Customer[];
  sales: SalePickerRow[];
  products: ProductWithStock[];
  trigger: ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saleItemOptions, setSaleItemOptions] = useState<SaleItemOption[]>([]);
  const [loadingSaleItems, setLoadingSaleItems] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: defaultValues(),
  });

  const customerId = watch("customer_id");
  const originalSaleId = watch("original_sale_id");

  const customerItems = customers.map((customer) => ({
    value: customer.id,
    label: customer.customer_name,
  }));

  const saleItems = customerId
    ? sales.filter((sale) => sale.customer_id === customerId)
    : [];
  const saleItemsForPicker = saleItems.map((sale) => ({
    value: sale.id,
    label: `${sale.invoice_number} (${sale.sale_date})`,
  }));

  const productItems = products.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.description}`,
  }));

  useEffect(() => {
    if (!originalSaleId) {
      setSaleItemOptions([]);
      return;
    }

    let cancelled = false;
    setLoadingSaleItems(true);
    const supabase = createClient();
    supabase
      .from("sale_items")
      .select("id, product_id, quantity, product:products(sku, description)")
      .eq("sale_id", originalSaleId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const rows = data as unknown as Array<{
          id: string;
          product_id: string;
          quantity: number;
          product: { sku: string; description: string } | null;
        }>;
        setSaleItemOptions(
          rows.map((item) => ({
            saleItemId: item.id,
            productId: item.product_id,
            label: item.product
              ? `${item.product.sku} — ${item.product.description} (sold ${item.quantity})`
              : "Unknown product",
          })),
        );
        setLoadingSaleItems(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originalSaleId]);

  async function onSubmit(values: ReturnFormValues) {
    setFormError(null);
    const result = await createReturn(values);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    toast.success("Return recorded");
    reset(defaultValues());
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(defaultValues());
          setSaleItemOptions([]);
          setFormError(null);
        }
      }}
    >
      <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Customer" error={errors.customer_id?.message}>
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <SearchableSelect
                  items={customerItems}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("original_sale_id", "");
                    setValue("sale_item_id", "");
                    setValue("product_id", "");
                  }}
                  placeholder="Search for a customer..."
                />
              )}
            />
          </Field>

          <Field label="Original Sale (Optional)">
            <Controller
              control={control}
              name="original_sale_id"
              render={({ field }) => (
                <SearchableSelect
                  items={saleItemsForPicker}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("sale_item_id", "");
                    setValue("product_id", "");
                  }}
                  placeholder={
                    customerId
                      ? "Search for a sale..."
                      : "Select a customer first"
                  }
                  emptyText={
                    customerId ? "No sales for this customer." : "No matches."
                  }
                />
              )}
            />
          </Field>

          <Field label="Product" error={errors.product_id?.message}>
            {originalSaleId ? (
              <Controller
                control={control}
                name="sale_item_id"
                render={({ field }) => (
                  <SearchableSelect
                    items={saleItemOptions.map((item) => ({
                      value: item.saleItemId,
                      label: item.label,
                    }))}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const match = saleItemOptions.find(
                        (item) => item.saleItemId === value,
                      );
                      setValue("product_id", match?.productId ?? "");
                    }}
                    placeholder={
                      loadingSaleItems
                        ? "Loading products from this sale..."
                        : "Search for a product from this sale..."
                    }
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                name="product_id"
                render={({ field }) => (
                  <SearchableSelect
                    items={productItems}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search for a product..."
                  />
                )}
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" error={errors.quantity?.message}>
              <Input inputMode="decimal" {...register("quantity")} />
            </Field>
            <Field label="Return Date" error={errors.return_date?.message}>
              <Input type="date" {...register("return_date")} />
            </Field>
          </div>

          <Field label="Reason" error={errors.reason?.message}>
            <Input
              placeholder="e.g. Wrong size delivered"
              {...register("reason")}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="restock"
              render={({ field }) => (
                <Switch
                  id="restock"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="restock">Restock this quantity</Label>
          </div>

          <Field label="Refund Amount (AED, Optional)" error={errors.refund_amount?.message}>
            <Input inputMode="decimal" {...register("refund_amount")} />
          </Field>

          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
