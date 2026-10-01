"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

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
import { Field } from "@/components/ui/form-field";
import { updateSaleDetails } from "@/lib/actions/sales";
import {
  editSaleFormSchema,
  type EditSaleFormValues,
} from "@/lib/validation/sale";
import type { Sale } from "@/lib/types/sale";

function defaultValues(sale: Sale): EditSaleFormValues {
  return {
    sale_date: sale.sale_date,
    invoice_number: sale.invoice_number,
    delivery_note_number: sale.delivery_note_number ?? "",
    tax_percent: String(sale.tax_percent),
    notes: sale.notes ?? "",
  };
}

export function EditSaleDialog({ sale }: { sale: Sale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditSaleFormValues>({
    resolver: zodResolver(editSaleFormSchema),
    defaultValues: defaultValues(sale),
  });

  async function onSubmit(values: EditSaleFormValues) {
    setFormError(null);
    const result = await updateSaleDetails(sale.id, values);
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit invoice {sale.invoice_number}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          id="edit-sale-form"
        >
          <Field label="Sale date" error={errors.sale_date?.message}>
            <Input type="date" {...register("sale_date")} />
          </Field>
          <Field
            label="Invoice number"
            error={errors.invoice_number?.message}
          >
            <Input {...register("invoice_number")} />
          </Field>
          <Field label="Delivery note number">
            <Input {...register("delivery_note_number")} />
          </Field>
          <Field label="Tax %" error={errors.tax_percent?.message}>
            <Input inputMode="decimal" {...register("tax_percent")} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
        </form>

        <DialogFooter>
          <Button type="submit" form="edit-sale-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
