"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/form-field";
import { ProductPhotoUploader } from "@/components/products/product-photo-uploader";
import { createProduct, updateProduct } from "@/lib/actions/products";
import {
  productFormSchema,
  buildProductPayload,
  type ProductFormValues,
} from "@/lib/validation/product";
import type { Product } from "@/lib/types/product";

function toFormValues(product?: Product | null): ProductFormValues {
  return {
    sku: product?.sku ?? "",
    model_number: product?.model_number ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    size_specification: product?.size_specification ?? "",
    colour: product?.colour ?? "",
    unit: product?.unit ?? "PCS",
    pcs_per_carton: product?.pcs_per_carton?.toString() ?? "",
    kg_per_carton: product?.kg_per_carton?.toString() ?? "",
    kg_per_pallet: product?.kg_per_pallet?.toString() ?? "",
    sqm_per_carton: product?.sqm_per_carton?.toString() ?? "",
    cost_price: product?.cost_price?.toString() ?? "",
    selling_price: product?.selling_price?.toString() ?? "",
    reorder_level: product?.reorder_level?.toString() ?? "0",
    notes: product?.notes ?? "",
    active: product?.active ?? true,
  };
}

export function ProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();
  const isEditing = Boolean(product);
  const [productId] = useState(() => product?.id ?? crypto.randomUUID());
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    product?.photo_url ?? null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product),
  });

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);
    const payload = buildProductPayload(productId, values, photoUrl);
    const action = isEditing ? updateProduct : createProduct;
    const result = await action(payload);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <ProductPhotoUploader
        productId={productId}
        value={photoUrl}
        onChange={setPhotoUrl}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Item Number" error={errors.sku?.message}>
          <Input {...register("sku")} />
        </Field>
        <Field label="Model Number" error={errors.model_number?.message}>
          <Input {...register("model_number")} />
        </Field>
      </div>

      <Field label="Description" error={errors.description?.message}>
        <Input {...register("description")} />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Product Category" error={errors.category?.message}>
          <Input {...register("category")} />
        </Field>
        <Field
          label="Size/Dimension"
          error={errors.size_specification?.message}
        >
          <Input {...register("size_specification")} />
        </Field>
        <Field label="Colour" error={errors.colour?.message}>
          <Input {...register("colour")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Unit" error={errors.unit?.message}>
          <Input {...register("unit")} />
        </Field>
        <Field label="PCS/CTN" error={errors.pcs_per_carton?.message}>
          <Input inputMode="decimal" {...register("pcs_per_carton")} />
        </Field>
        <Field label="KG/CTN" error={errors.kg_per_carton?.message}>
          <Input inputMode="decimal" {...register("kg_per_carton")} />
        </Field>
        <Field label="KG/Pallet" error={errors.kg_per_pallet?.message}>
          <Input inputMode="decimal" {...register("kg_per_pallet")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="SQM/CTN" error={errors.sqm_per_carton?.message}>
          <Input inputMode="decimal" {...register("sqm_per_carton")} />
        </Field>
        <Field label="Cost Price (AED)" error={errors.cost_price?.message}>
          <Input inputMode="decimal" {...register("cost_price")} />
        </Field>
        <Field
          label="Selling Price (AED)"
          error={errors.selling_price?.message}
        >
          <Input inputMode="decimal" {...register("selling_price")} />
        </Field>
        <Field label="Reorder Level" error={errors.reorder_level?.message}>
          <Input inputMode="decimal" {...register("reorder_level")} />
        </Field>
      </div>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea rows={3} {...register("notes")} />
      </Field>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <Switch
              id="active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
