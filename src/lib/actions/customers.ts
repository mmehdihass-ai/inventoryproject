"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  customerPayloadSchema,
  type CustomerPayload,
} from "@/lib/validation/customer";

type ActionResult = { error: string } | undefined;

export async function createCustomer(
  payload: CustomerPayload,
): Promise<ActionResult> {
  const parsed = customerPayloadSchema.parse(payload);
  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(parsed);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customers");
  redirect(`/customers/${parsed.id}`);
}

export async function updateCustomer(
  payload: CustomerPayload,
): Promise<ActionResult> {
  const parsed = customerPayloadSchema.parse(payload);
  const { id, ...fields } = parsed;
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update(fields)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}
