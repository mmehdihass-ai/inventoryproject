import * as z from "zod";

function numericField(opts: { positive?: boolean } = {}) {
  return z.string().refine(
    (v) => {
      if (v.trim() === "") return true;
      const n = Number(v);
      if (Number.isNaN(n)) return false;
      return opts.positive ? n > 0 : n >= 0;
    },
    { error: opts.positive ? "Must be greater than 0" : "Must be 0 or more" },
  );
}

export const productFormSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  vendor_name: z.string(),
  model_number: z.string(),
  description: z.string().min(1, "Description is required"),
  category: z.string(),
  size_specification: z.string(),
  colour: z.string(),
  unit: z.string().min(1, "Unit is required"),
  pcs_per_carton: numericField({ positive: true }),
  kg_per_carton: numericField({ positive: true }),
  kg_per_pallet: numericField({ positive: true }),
  sqm_per_carton: numericField({ positive: true }),
  cost_price: numericField(),
  selling_price: numericField(),
  reorder_level: numericField(),
  notes: z.string(),
  active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productPayloadSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1),
  vendor_name: z.string().nullable(),
  model_number: z.string().nullable(),
  description: z.string().min(1),
  category: z.string().nullable(),
  size_specification: z.string().nullable(),
  colour: z.string().nullable(),
  unit: z.string().min(1),
  pcs_per_carton: z.number().positive().nullable(),
  kg_per_carton: z.number().positive().nullable(),
  kg_per_pallet: z.number().positive().nullable(),
  sqm_per_carton: z.number().positive().nullable(),
  cost_price: z.number().nonnegative().nullable(),
  selling_price: z.number().nonnegative().nullable(),
  reorder_level: z.number().nonnegative(),
  photo_url: z.string().nullable(),
  notes: z.string().nullable(),
  active: z.boolean(),
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function buildProductPayload(
  id: string,
  values: ProductFormValues,
  photoUrl: string | null,
): ProductPayload {
  return productPayloadSchema.parse({
    id,
    sku: values.sku.trim(),
    vendor_name: values.vendor_name.trim() || null,
    model_number: values.model_number.trim() || null,
    description: values.description.trim(),
    category: values.category.trim() || null,
    size_specification: values.size_specification.trim() || null,
    colour: values.colour.trim() || null,
    unit: values.unit.trim(),
    pcs_per_carton: toNullableNumber(values.pcs_per_carton),
    kg_per_carton: toNullableNumber(values.kg_per_carton),
    kg_per_pallet: toNullableNumber(values.kg_per_pallet),
    sqm_per_carton: toNullableNumber(values.sqm_per_carton),
    cost_price: toNullableNumber(values.cost_price),
    selling_price: toNullableNumber(values.selling_price),
    reorder_level: toNullableNumber(values.reorder_level) ?? 0,
    photo_url: photoUrl,
    notes: values.notes.trim() || null,
    active: values.active,
  });
}
