import * as z from "zod";

const requiredPositiveNumericString = z.string().refine(
  (v) => {
    if (v.trim() === "") return false;
    const n = Number(v);
    return !Number.isNaN(n) && n > 0;
  },
  { error: "Enter a quantity greater than 0" },
);

const optionalNonNegativeNumericString = z.string().refine(
  (v) => v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
  { error: "Must be 0 or more" },
);

export const stockInFormSchema = z.object({
  transaction_type: z.enum(["STOCK_IN", "OPENING_STOCK"]),
  transaction_date: z.string().min(1, "Date is required"),
  product_id: z.string().min(1, "Select a product"),
  quantity: requiredPositiveNumericString,
  supplier_name: z.string(),
  reference_number: z.string(),
  unit_cost: optionalNonNegativeNumericString,
  notes: z.string(),
});

export type StockInFormValues = z.infer<typeof stockInFormSchema>;

export const adjustmentFormSchema = z.object({
  transaction_date: z.string().min(1, "Date is required"),
  product_id: z.string().min(1, "Select a product"),
  direction: z.enum(["IN", "OUT"]),
  quantity: requiredPositiveNumericString,
  reason: z.string().min(1, "Reason is required"),
  notes: z.string(),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;
