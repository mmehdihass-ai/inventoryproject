import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LedgerEntry } from "@/lib/types/transaction";

export async function listProductLedger(
  productId: string,
): Promise<LedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_transaction_ledger")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
