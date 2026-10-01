-- Editing an invoice now also covers its line items (customer changed
-- their mind during the sale). This supersedes fn_update_sale_details:
-- fn_update_sale replaces a sale's lines and detail fields atomically —
-- old SALE ledger rows for this sale are removed (restoring stock) and
-- fresh ones written for the new lines, with the same oversell-safety
-- check fn_record_sale uses. If a line was already returned against,
-- return_items' FK to sale_items blocks the delete and the whole edit
-- rolls back with a clear error, same as any other constraint violation.

drop function if exists fn_update_sale_details(uuid, date, text, text, numeric, text);

create or replace function fn_update_sale(
  p_sale_id uuid,
  p_sale_date date,
  p_invoice_number text,
  p_delivery_note_number text,
  p_tax_percent numeric,
  p_notes text,
  p_lines jsonb
)
returns sales
language plpgsql
as $$
declare
  v_sale sales;
  v_product_ids uuid[];
  v_line jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_unit_price numeric;
  v_discount numeric;
  v_line_total numeric;
  v_available numeric;
  v_total numeric := 0;
  v_discount_total numeric := 0;
  v_tax_amount numeric := 0;
  v_grand_total numeric := 0;
begin
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'A sale must have at least one line item';
  end if;

  select * into v_sale from sales where id = p_sale_id for update;
  if not found then
    raise exception 'Sale not found';
  end if;

  select array_agg(distinct product_id) into v_product_ids
  from (
    select product_id from sale_items where sale_id = p_sale_id
    union
    select (line ->> 'product_id')::uuid
    from jsonb_array_elements(p_lines) as line
  ) t;

  perform 1 from products where id = any(v_product_ids) order by id for update;

  delete from inventory_transactions
  where sale_id = p_sale_id and transaction_type = 'SALE';

  delete from sale_items where sale_id = p_sale_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_quantity := (v_line ->> 'quantity')::numeric;
    v_unit_price := (v_line ->> 'unit_price')::numeric;
    v_discount := coalesce((v_line ->> 'discount')::numeric, 0);

    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than 0';
    end if;

    select coalesce(sum(quantity), 0) into v_available
    from inventory_transactions
    where product_id = v_product_id;

    if v_available < v_quantity then
      raise exception 'Available stock: % PCS, Requested quantity: % PCS for one of the selected products',
        v_available, v_quantity;
    end if;

    v_line_total := (v_quantity * v_unit_price) - v_discount;

    declare
      v_sale_item_id uuid;
    begin
      insert into sale_items (
        sale_id, product_id, quantity, unit_price, discount, line_total
      ) values (
        p_sale_id, v_product_id, v_quantity, v_unit_price, v_discount, v_line_total
      )
      returning id into v_sale_item_id;

      insert into inventory_transactions (
        transaction_date, transaction_type, product_id, quantity,
        reference_type, reference_number, customer_id, sale_id, sale_item_id, notes
      ) values (
        p_sale_date, 'SALE', v_product_id, -v_quantity,
        'SALE', p_invoice_number, v_sale.customer_id, p_sale_id, v_sale_item_id, p_notes
      );
    end;

    v_total := v_total + v_line_total;
    v_discount_total := v_discount_total + v_discount;
  end loop;

  v_tax_amount := round(v_total * coalesce(p_tax_percent, 0) / 100, 2);
  v_grand_total := v_total + v_tax_amount;

  update sales
  set sale_date = p_sale_date,
      invoice_number = p_invoice_number,
      delivery_note_number = p_delivery_note_number,
      tax_percent = coalesce(p_tax_percent, 0),
      total_amount = v_total,
      discount_total = v_discount_total,
      tax_amount = v_tax_amount,
      grand_total = v_grand_total,
      notes = p_notes
  where id = p_sale_id
  returning * into v_sale;

  return v_sale;
end;
$$;

grant execute on function fn_update_sale(uuid, date, text, text, numeric, text, jsonb) to authenticated;
