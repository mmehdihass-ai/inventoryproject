export type TransactionType =
  | "OPENING_STOCK"
  | "STOCK_IN"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "DAMAGE"
  | "SUPPLIER_RETURN"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export type InventoryTransaction = {
  id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  product_id: string;
  quantity: number;
  reference_type: string | null;
  reference_number: string | null;
  reason: string | null;
  customer_id: string | null;
  sale_id: string | null;
  sale_item_id: string | null;
  return_id: string | null;
  return_item_id: string | null;
  supplier_name: string | null;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type LedgerEntry = InventoryTransaction & {
  running_balance: number;
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  OPENING_STOCK: "Opening stock",
  STOCK_IN: "Stock in",
  SALE: "Sale",
  RETURN: "Return",
  ADJUSTMENT_IN: "Adjustment (in)",
  ADJUSTMENT_OUT: "Adjustment (out)",
  DAMAGE: "Damage",
  SUPPLIER_RETURN: "Supplier return",
  TRANSFER_IN: "Transfer in",
  TRANSFER_OUT: "Transfer out",
};
