-- New Sale form now collects contact details for a brand-new customer.
-- fn_record_sale writes them only when it creates the customer row; an
-- existing customer's stored details are left untouched (the form pulls
-- them read-only from the database instead of re-submitting them).

drop function if exists fn_record_sale(text, date, text, text, text, jsonb);

create or replace function fn_record_sale(
  p_customer_name text,
  p_sale_date date,
  p_invoice_number text,
  p_delivery_note_number text,
  p_notes text,
  p_lines jsonb,
  p_customer_contact_person text default null,
  p_customer_phone text default null,
  p_customer_email text default null,
  p_customer_address text default null
)
returns sales
language plpgsql
as $$
declare
  v_customer_id uuid;
  v_sale sales;
  v_line jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_unit_price numeric;
  v_discount numeric;
  v_line_total numeric;
  v_available numeric;
  v_total numeric := 0;
  v_discount_total numeric := 0;
  v_sale_item_id uuid;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'Customer name is required';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'A sale must have at least one line item';
  end if;

  select id into v_customer_id
  from customers
  where lower(customer_name) = lower(btrim(p_customer_name))
  limit 1;

  if v_customer_id is null then
    insert into customers (customer_name, contact_person, phone, email, address)
    values (
      btrim(p_customer_name),
      nullif(btrim(coalesce(p_customer_contact_person, '')), ''),
      nullif(btrim(coalesce(p_customer_phone, '')), ''),
      nullif(btrim(coalesce(p_customer_email, '')), ''),
      nullif(btrim(coalesce(p_customer_address, '')), '')
    )
    returning id into v_customer_id;
  end if;

  perform 1
  from products
  where id in (
    select (line ->> 'product_id')::uuid
    from jsonb_array_elements(p_lines) as line
  )
  order by id
  for update;

  insert into sales (
    sale_date, customer_id, invoice_number, delivery_note_number, notes
  ) values (
    p_sale_date, v_customer_id, p_invoice_number, p_delivery_note_number, p_notes
  )
  returning * into v_sale;

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

    insert into sale_items (
      sale_id, product_id, quantity, unit_price, discount, line_total
    ) values (
      v_sale.id, v_product_id, v_quantity, v_unit_price, v_discount, v_line_total
    )
    returning id into v_sale_item_id;

    insert into inventory_transactions (
      transaction_date, transaction_type, product_id, quantity,
      reference_type, reference_number, customer_id, sale_id, sale_item_id, notes
    ) values (
      p_sale_date, 'SALE', v_product_id, -v_quantity,
      'SALE', p_invoice_number, v_customer_id, v_sale.id, v_sale_item_id, p_notes
    );

    v_total := v_total + v_line_total;
    v_discount_total := v_discount_total + v_discount;
  end loop;

  update sales
  set total_amount = v_total, discount_total = v_discount_total
  where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

grant execute on function fn_record_sale(text, date, text, text, text, jsonb, text, text, text, text) to authenticated;
