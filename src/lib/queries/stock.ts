import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentStockMap(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("current_stock").select("*");
  if (error) throw error;
  return new Map(data.map((row) => [row.product_id as string, Number(row.stock_pcs)]));
}

export async function getCurrentStock(productId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("current_stock")
    .select("stock_pcs")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return data ? Number(data.stock_pcs) : 0;
}
