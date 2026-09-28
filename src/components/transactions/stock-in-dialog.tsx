"use client";

import { useState, type ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field } from "@/components/ui/form-field";
import { createStockIn } from "@/lib/actions/transactions";
import {
  stockInFormSchema,
  type StockInFormValues,
} from "@/lib/validation/transaction";
import type { Product } from "@/lib/types/product";

const TRANSACTION_TYPE_ITEMS = [
  { value: "STOCK_IN", label: "Stock in" },
  { value: "OPENING_STOCK", label: "Opening stock" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(): StockInFormValues {
  return {
    transaction_type: "STOCK_IN",
    transaction_date: today(),
    product_id: "",
    quantity: "",
    supplier_name: "",
    reference_number: "",
    unit_cost: "",
    notes: "",
  };
}

export function StockInDialog({
  products,
  trigger,
  triggerClassName,
}: {
  products: Product[];
  trigger: ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const productItems = products.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.description}`,
  }));

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockInFormValues>({
    resolver: zodResolver(stockInFormSchema),
    defaultValues: defaultValues(),
  });

  async function onSubmit(values: StockInFormValues) {
    setFormError(null);
    const result = await createStockIn(values);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    toast.success("Stock in recorded");
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
          setFormError(null);
        }
      }}
    >
      <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock in</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Controller
                control={control}
                name="transaction_type"
                render={({ field }) => (
                  <Select
                    items={TRANSACTION_TYPE_ITEMS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK_IN">Stock in</SelectItem>
                      <SelectItem value="OPENING_STOCK">
                        Opening stock
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Date" error={errors.transaction_date?.message}>
              <Input type="date" {...register("transaction_date")} />
            </Field>
          </div>

          <Field label="Product" error={errors.product_id?.message}>
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
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity (PCS)" error={errors.quantity?.message}>
              <Input inputMode="decimal" {...register("quantity")} />
            </Field>
            <Field
              label="Cost (AED, optional)"
              error={errors.unit_cost?.message}
            >
              <Input inputMode="decimal" {...register("unit_cost")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier name">
              <Input {...register("supplier_name")} />
            </Field>
            <Field label="PO / reference">
              <Input {...register("reference_number")} />
            </Field>
          </div>

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
