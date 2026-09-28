export type Return = {
  id: string;
  return_date: string;
  customer_id: string;
  original_sale_id: string | null;
  return_reference: string;
  reason: string | null;
  refund_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReturnItem = {
  id: string;
  return_id: string;
  sale_item_id: string | null;
  product_id: string;
  quantity: number;
  restock: boolean;
  created_at: string;
};
