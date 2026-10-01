import * as z from "zod";

const requiredPositiveNumericString = z.string().refine(
  (v) => v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) > 0,
  { error: "Must be greater than 0" },
);

const nonNegativeNumericString = z.string().refine(
  (v) => v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
  { error: "Must be 0 or more" },
);

const percentString = z.string().refine(
  (v) =>
    v.trim() === "" ||
    (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
  { error: "Must be between 0 and 100" },
);

export const saleLineSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  quantity: requiredPositiveNumericString,
  unit_price: requiredPositiveNumericString,
  // A percentage, not a flat amount — converted to a flat discount before
  // it reaches fn_record_sale/fn_update_sale, which still store a flat sum.
  discount: percentString,
});

export const saleFormSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_contact_person: z.string(),
  customer_phone: z.string(),
  customer_email: z.string(),
  customer_address: z.string(),
  invoice_number: z.string().min(1, "Invoice number is required"),
  delivery_note_number: z.string(),
  tax_percent: nonNegativeNumericString,
  advance_amount: nonNegativeNumericString,
  advance_payment_method: z.string(),
  notes: z.string(),
  lines: z.array(saleLineSchema).min(1, "Add at least one product"),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;

export const editSaleFormSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  delivery_note_number: z.string(),
  tax_percent: nonNegativeNumericString,
  notes: z.string(),
  lines: z.array(saleLineSchema).min(1, "Add at least one product"),
});

export type EditSaleFormValues = z.infer<typeof editSaleFormSchema>;

export const paymentFormSchema = z.object({
  amount: requiredPositiveNumericString,
  payment_method: z.string(),
  paid_on: z.string().min(1, "Date is required"),
  notes: z.string(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
