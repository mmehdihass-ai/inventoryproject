-- Phase 4: customers, sales, sale line items, and the fn_record_sale RPC
-- that atomically validates stock and writes SALE ledger entries.

create table customers (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create trigger customers_set_updated_at
  before update on customers
  for each row
  execute function set_updated_at();

alter table customers enable row level security;

create policy "Authenticated users can manage customers"
  on customers
  for all
  to authenticated
  using (true)
  with check (true);

create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  customer_id uuid not null references customers (id),
  invoice_number text not null unique,
  delivery_note_number text,
  discount_total numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  notes text,
  status text not null default 'COMPLETED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index sales_customer_idx on sales (customer_id);
create index sales_invoice_idx on sales (invoice_number);
create index sales_delivery_note_idx on sales (delivery_note_number);
create index sales_date_idx on sales (sale_date);

create trigger sales_set_updated_at
  before update on sales
  for each row
  execute function set_updated_at();

alter table sales enable row level security;

create policy "Authenticated users can manage sales"
  on sales
  for all
  to authenticated
  using (true)
  with check (true);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid not null references products (id),
  quantity numeric not null check (quantity > 0),
  unit_price numeric(12, 2) not null,
  discount numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index sale_items_sale_idx on sale_items (sale_id);
create index sale_items_product_idx on sale_items (product_id);

alter table sale_items enable row level security;

create policy "Authenticated users can manage sale items"
  on sale_items
  for all
  to authenticated
  using (true)
  with check (true);

-- Now that customers/sales/sale_items exist, close the loop on the ledger's
-- references so they can never point at rows that don't exist.
alter table inventory_transactions
  add constraint inventory_transactions_customer_id_fkey
    foreign key (customer_id) references customers (id),
  add constraint inventory_transactions_sale_id_fkey
    foreign key (sale_id) references sales (id),
  add constraint inventory_transactions_sale_item_id_fkey
    foreign key (sale_item_id) references sale_items (id);

-- Records a full sale atomically: locks every involved product (sorted by
-- id, to avoid deadlocking against another concurrent multi-line sale),
-- rejects the whole sale if any line would oversell, then writes the sale
-- header, each sale_item, and one signed SALE ledger entry per line.
create or replace function fn_record_sale(
  p_customer_id uuid,
  p_sale_date date,
  p_invoice_number text,
  p_delivery_note_number text,
  p_notes text,
  p_lines jsonb
)
returns sales
language plpgsql
as $$
declare
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
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'A sale must have at least one line item';
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
    p_sale_date, p_customer_id, p_invoice_number, p_delivery_note_number, p_notes
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
      'SALE', p_invoice_number, p_customer_id, v_sale.id, v_sale_item_id, p_notes
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

grant execute on function fn_record_sale(uuid, date, text, text, text, jsonb) to authenticated;
