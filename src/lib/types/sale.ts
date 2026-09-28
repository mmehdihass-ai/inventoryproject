export type Sale = {
  id: string;
  sale_date: string;
  customer_id: string;
  invoice_number: string;
  delivery_note_number: string | null;
  discount_total: number;
  total_amount: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  created_at: string;
};
