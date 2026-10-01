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
import { createAdjustment } from "@/lib/actions/transactions";
import {
  adjustmentFormSchema,
  type AdjustmentFormValues,
} from "@/lib/validation/transaction";
import type { Product } from "@/lib/types/product";

const DIRECTION_ITEMS = [
  { value: "IN", label: "Increase stock" },
  { value: "OUT", label: "Decrease stock" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(): AdjustmentFormValues {
  return {
    transaction_date: today(),
    product_id: "",
    direction: "IN",
    quantity: "",
    reason: "",
    notes: "",
  };
}

export function AdjustmentDialog({
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
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: defaultValues(),
  });

  async function onSubmit(values: AdjustmentFormValues) {
    setFormError(null);
    const result = await createAdjustment(values);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    toast.success("Adjustment recorded");
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
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Inventory Adjustment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Direction">
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select
                    items={DIRECTION_ITEMS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Increase Stock</SelectItem>
                      <SelectItem value="OUT">Decrease Stock</SelectItem>
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

          <Field label="Quantity (PCS)" error={errors.quantity?.message}>
            <Input inputMode="decimal" {...register("quantity")} />
          </Field>

          <Field label="Reason" error={errors.reason?.message}>
            <Input
              placeholder="e.g. Physical count correction"
              {...register("reason")}
            />
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
