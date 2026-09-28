import * as z from "zod";

const requiredPositiveNumericString = z.string().refine(
  (v) => v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) > 0,
  { error: "Enter a quantity greater than 0" },
);

const optionalNonNegativeNumericString = z.string().refine(
  (v) => v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
  { error: "Must be 0 or more" },
);

export const returnFormSchema = z.object({
  return_date: z.string().min(1, "Date is required"),
  customer_id: z.string().min(1, "Select a customer"),
  original_sale_id: z.string(),
  sale_item_id: z.string(),
  product_id: z.string().min(1, "Select a product"),
  quantity: requiredPositiveNumericString,
  reason: z.string().min(1, "Reason is required"),
  restock: z.boolean(),
  refund_amount: optionalNonNegativeNumericString,
  notes: z.string(),
});

export type ReturnFormValues = z.infer<typeof returnFormSchema>;
