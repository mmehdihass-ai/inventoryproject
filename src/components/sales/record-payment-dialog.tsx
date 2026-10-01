"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

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
import { recordPayment } from "@/lib/actions/sales";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/lib/validation/sale";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(): PaymentFormValues {
  return { amount: "", payment_method: "", paid_on: today(), notes: "" };
}

export function RecordPaymentDialog({
  saleId,
  invoiceNumber,
  balanceDue,
}: {
  saleId: string;
  invoiceNumber: string;
  balanceDue: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: defaultValues(),
  });

  async function onSubmit(values: PaymentFormValues) {
    setFormError(null);
    const result = await recordPayment(saleId, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    toast.success("Payment recorded");
    setOpen(false);
    reset(defaultValues());
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Wallet className="h-4 w-4" />
        Record payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment — {invoiceNumber}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          id="record-payment-form"
        >
          {balanceDue > 0 && (
            <p className="text-sm text-muted-foreground">
              Balance due: {balanceDue.toFixed(2)} AED
            </p>
          )}
          <Field label="Amount" error={errors.amount?.message}>
            <Input inputMode="decimal" {...register("amount")} />
          </Field>
          <Field label="Payment method">
            <Input
              placeholder="Cash, bank transfer..."
              {...register("payment_method")}
            />
          </Field>
          <Field label="Paid on" error={errors.paid_on?.message}>
            <Input type="date" {...register("paid_on")} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="record-payment-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
