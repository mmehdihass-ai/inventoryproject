"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil } from "lucide-react";

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
import { Field } from "@/components/ui/form-field";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import {
  customerFormSchema,
  buildCustomerPayload,
  type CustomerFormValues,
} from "@/lib/validation/customer";
import type { Customer } from "@/lib/types/customer";

function toFormValues(customer?: Customer | null): CustomerFormValues {
  return {
    customer_name: customer?.customer_name ?? "",
    contact_person: customer?.contact_person ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
    active: customer?.active ?? true,
  };
}

export function CustomerFormDialog({
  customer,
}: {
  customer?: Customer | null;
}) {
  const isEditing = Boolean(customer);
  const [open, setOpen] = useState(false);
  const [customerId] = useState(() => customer?.id ?? crypto.randomUUID());
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toFormValues(customer),
  });

  async function onSubmit(values: CustomerFormValues) {
    setFormError(null);
    const payload = buildCustomerPayload(customerId, values);
    const action = isEditing ? updateCustomer : createCustomer;
    const result = await action(payload);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(toFormValues(customer));
          setFormError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant={isEditing ? "outline" : "default"} size="sm" />
        }
      >
        {isEditing ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isEditing ? "Edit customer" : "New customer"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit customer" : "New customer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Customer name" error={errors.customer_name?.message}>
            <Input {...register("customer_name")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person">
              <Input {...register("contact_person")} />
            </Field>
            <Field label="Phone">
              <Input {...register("phone")} />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>

          <Field label="Address">
            <Textarea rows={2} {...register("address")} />
          </Field>

          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch
                  id="customer-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="customer-active">Active</Label>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
