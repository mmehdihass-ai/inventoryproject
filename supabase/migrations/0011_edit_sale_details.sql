-- "Edit invoice" on the Sale Detail page. Details-only: date, invoice/DN
-- number, tax rate, and notes. Line items stay locked once saved — stock
-- history is never mutated, only corrected via a separate Adjustment.
create or replace function fn_update_sale_details(
  p_sale_id uuid,
  p_sale_date date,
  p_invoice_number text,
  p_delivery_note_number text,
  p_tax_percent numeric,
  p_notes text
)
returns sales
language plpgsql
as $$
declare
  v_sale sales;
begin
  update sales
  set sale_date = p_sale_date,
      invoice_number = p_invoice_number,
      delivery_note_number = p_delivery_note_number,
      tax_percent = coalesce(p_tax_percent, 0),
      tax_amount = round(total_amount * coalesce(p_tax_percent, 0) / 100, 2),
      grand_total = total_amount + round(total_amount * coalesce(p_tax_percent, 0) / 100, 2),
      notes = p_notes
  where id = p_sale_id
  returning * into v_sale;

  if not found then
    raise exception 'Sale not found';
  end if;

  return v_sale;
end;
$$;

grant execute on function fn_update_sale_details(uuid, date, text, text, numeric, text) to authenticated;
