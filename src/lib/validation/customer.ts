import * as z from "zod";

export const customerFormSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  contact_person: z.string(),
  phone: z.string(),
  email: z.string().refine(
    (v) => v.trim() === "" || z.email().safeParse(v).success,
    { error: "Enter a valid email" },
  ),
  address: z.string(),
  notes: z.string(),
  active: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const customerPayloadSchema = z.object({
  id: z.string().uuid(),
  customer_name: z.string().min(1),
  contact_person: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  active: z.boolean(),
});

export type CustomerPayload = z.infer<typeof customerPayloadSchema>;

export function buildCustomerPayload(
  id: string,
  values: CustomerFormValues,
): CustomerPayload {
  return customerPayloadSchema.parse({
    id,
    customer_name: values.customer_name.trim(),
    contact_person: values.contact_person.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    address: values.address.trim() || null,
    notes: values.notes.trim() || null,
    active: values.active,
  });
}
