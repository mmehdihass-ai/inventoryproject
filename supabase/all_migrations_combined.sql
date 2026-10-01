-- Phase 2: products table, updated_at trigger helper, product photo storage.

create extension if not exists pgcrypto;

-- Reusable trigger function: keeps updated_at current on every row update.
-- Future tables (customers, sales, returns, ...) reuse this same function.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table products (
  id uuid primary key default gen_random_uuid(),

  sku text not null unique,
  model_number text,
  description text not null,
  category text,
  size_specification text,
  colour text,
  unit text not null default 'PCS',

  pcs_per_carton numeric,
  kg_per_carton numeric,
  kg_per_pallet numeric,
  sqm_per_carton numeric,

  cost_price numeric(12, 2),
  selling_price numeric(12, 2),
  reorder_level numeric not null default 0,

  photo_url text,
  notes text,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index products_category_idx on products (category);
create index products_active_idx on products (active);

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

alter table products enable row level security;

create policy "Authenticated users can manage products"
  on products
  for all
  to authenticated
  using (true)
  with check (true);

-- Product photos: public read (images aren't sensitive), authenticated write.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "Public can view product photos"
  on storage.objects for select
  to public
  using (bucket_id = 'product-photos');

create policy "Authenticated users can upload product photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-photos');

create policy "Authenticated users can update product photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-photos');

create policy "Authenticated users can delete product photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-photos');
-- Phase 3: the inventory transaction ledger. Current stock is derived,
-- never stored directly (see product spec's core principle).

create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),

  transaction_date date not null,
  transaction_type text not null check (transaction_type in (
    'OPENING_STOCK', 'STOCK_IN', 'SALE', 'RETURN',
    'ADJUSTMENT_IN', 'ADJUSTMENT_OUT',
    'DAMAGE', 'SUPPLIER_RETURN', 'TRANSFER_IN', 'TRANSFER_OUT'
  )),

  product_id uuid not null references products (id),
  -- Signed: positive for stock moving in, negative for stock moving out.
  -- Current stock for a product is simply sum(quantity).
  quantity numeric not null,

  reference_type text,
  reference_number text,
  reason text,

  customer_id uuid,
  sale_id uuid,
  sale_item_id uuid,
  return_id uuid,
  return_item_id uuid,

  supplier_name text,
  unit_cost numeric(12, 2),
  notes text,

  created_at timestamptz not null default now(),
  created_by uuid
);

create index inventory_transactions_product_created_idx
  on inventory_transactions (product_id, created_at);
create index inventory_transactions_type_idx
  on inventory_transactions (transaction_type);
create index inventory_transactions_reference_number_idx
  on inventory_transactions (reference_number);
create index inventory_transactions_transaction_date_idx
  on inventory_transactions (transaction_date);

alter table inventory_transactions enable row level security;

create policy "Authenticated users can manage inventory transactions"
  on inventory_transactions
  for all
  to authenticated
  using (true)
  with check (true);

-- Current stock per product, derived from the ledger. Never edited directly.
create view current_stock as
select product_id, sum(quantity) as stock_pcs
from inventory_transactions
group by product_id;

grant select on current_stock to authenticated;

-- Per-product transaction history with a running balance, computed once
-- here so the app never has to reconcile it client-side.
create view product_transaction_ledger as
select
  it.*,
  sum(it.quantity) over (
    partition by it.product_id
    order by it.created_at, it.id
  ) as running_balance
from inventory_transactions it;

grant select on product_transaction_ledger to authenticated;

-- Stock In / Opening Stock: always increases stock, no negative-stock risk.
create or replace function fn_stock_in(
  p_product_id uuid,
  p_quantity numeric,
  p_transaction_type text,
  p_transaction_date date,
  p_reference_number text default null,
  p_supplier_name text default null,
  p_unit_cost numeric default null,
  p_notes text default null
)
returns inventory_transactions
language plpgsql
as $$
declare
  v_row inventory_transactions;
begin
  if p_transaction_type not in ('STOCK_IN', 'OPENING_STOCK') then
    raise exception 'Invalid transaction type for stock in: %', p_transaction_type;
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  -- Lock the product row so concurrent stock-affecting writes on the same
  -- product serialize against each other.
  perform 1 from products where id = p_product_id for update;
  if not found then
    raise exception 'Product not found';
  end if;

  insert into inventory_transactions (
    transaction_date, transaction_type, product_id, quantity,
    reference_type, reference_number, supplier_name, unit_cost, notes
  ) values (
    p_transaction_date, p_transaction_type, p_product_id, p_quantity,
    p_transaction_type, p_reference_number, p_supplier_name, p_unit_cost, p_notes
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function fn_stock_in(
  uuid, numeric, text, date, text, text, numeric, text
) to authenticated;

-- Adjustment: increase or decrease. Decrease is blocked if it would take
-- stock negative (checked against the ledger while the product row is
-- locked, so concurrent adjustments/sales can't race past each other).
create or replace function fn_record_adjustment(
  p_product_id uuid,
  p_quantity numeric,
  p_direction text,
  p_transaction_date date,
  p_reason text,
  p_notes text default null
)
returns inventory_transactions
language plpgsql
as $$
declare
  v_row inventory_transactions;
  v_available numeric;
  v_signed_quantity numeric;
  v_type text;
begin
  if p_direction not in ('IN', 'OUT') then
    raise exception 'Invalid adjustment direction: %', p_direction;
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A reason is required for adjustments';
  end if;

  perform 1 from products where id = p_product_id for update;
  if not found then
    raise exception 'Product not found';
  end if;

  if p_direction = 'OUT' then
    select coalesce(sum(quantity), 0) into v_available
    from inventory_transactions
    where product_id = p_product_id;

    if v_available < p_quantity then
      raise exception 'Available stock: % PCS, Requested quantity: % PCS',
        v_available, p_quantity;
    end if;

    v_signed_quantity := -p_quantity;
    v_type := 'ADJUSTMENT_OUT';
  else
    v_signed_quantity := p_quantity;
    v_type := 'ADJUSTMENT_IN';
  end if;

  insert into inventory_transactions (
    transaction_date, transaction_type, product_id, quantity,
    reference_type, reason, notes
  ) values (
    p_transaction_date, v_type, p_product_id, v_signed_quantity,
    'ADJUSTMENT', p_reason, p_notes
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function fn_record_adjustment(
  uuid, numeric, text, date, text, text
) to authenticated;
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
-- New Sale now takes a free-typed customer name instead of requiring a
-- pre-selected existing customer. fn_record_sale resolves it to an existing
-- customer (case-insensitive match) or creates one, atomically with the
-- rest of the sale.

drop function if exists fn_record_sale(uuid, date, text, text, text, jsonb);

create or replace function fn_record_sale(
  p_customer_name text,
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
    insert into customers (customer_name)
    values (btrim(p_customer_name))
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

grant execute on function fn_record_sale(text, date, text, text, text, jsonb) to authenticated;
-- Phase 5: returns, return_items, and the fn_record_return RPC.
-- Stock only moves when a return line is explicitly marked restocked.

create sequence if not exists returns_reference_seq start with 1;

create table returns (
  id uuid primary key default gen_random_uuid(),
  return_date date not null,
  customer_id uuid not null references customers (id),
  original_sale_id uuid references sales (id),
  return_reference text not null unique,
  reason text,
  refund_amount numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index returns_customer_idx on returns (customer_id);
create index returns_original_sale_idx on returns (original_sale_id);
create index returns_date_idx on returns (return_date);

create trigger returns_set_updated_at
  before update on returns
  for each row
  execute function set_updated_at();

alter table returns enable row level security;

create policy "Authenticated users can manage returns"
  on returns
  for all
  to authenticated
  using (true)
  with check (true);

create table return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references returns (id) on delete cascade,
  sale_item_id uuid references sale_items (id),
  product_id uuid not null references products (id),
  quantity numeric not null check (quantity > 0),
  restock boolean not null default true,
  created_at timestamptz not null default now()
);

create index return_items_return_idx on return_items (return_id);
create index return_items_product_idx on return_items (product_id);

alter table return_items enable row level security;

create policy "Authenticated users can manage return items"
  on return_items
  for all
  to authenticated
  using (true)
  with check (true);

alter table inventory_transactions
  add constraint inventory_transactions_return_id_fkey
    foreign key (return_id) references returns (id),
  add constraint inventory_transactions_return_item_id_fkey
    foreign key (return_item_id) references return_items (id);

-- Records a return (single product line). Only writes a RETURN ledger
-- entry — and so only ever increases stock — when p_restock is true;
-- a non-restocked return leaves inventory untouched by design.
create or replace function fn_record_return(
  p_customer_id uuid,
  p_original_sale_id uuid,
  p_sale_item_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_return_date date,
  p_reason text,
  p_restock boolean,
  p_refund_amount numeric,
  p_notes text
)
returns returns
language plpgsql
as $$
declare
  v_return returns;
  v_return_item_id uuid;
  v_reference text;
begin
  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  v_reference := 'RET-' || lpad(nextval('returns_reference_seq')::text, 6, '0');

  insert into returns (
    return_date, customer_id, original_sale_id, return_reference,
    reason, refund_amount, notes
  ) values (
    p_return_date, p_customer_id, p_original_sale_id, v_reference,
    p_reason, coalesce(p_refund_amount, 0), p_notes
  )
  returning * into v_return;

  insert into return_items (
    return_id, sale_item_id, product_id, quantity, restock
  ) values (
    v_return.id, p_sale_item_id, p_product_id, p_quantity, p_restock
  )
  returning id into v_return_item_id;

  if p_restock then
    perform 1 from products where id = p_product_id for update;

    insert into inventory_transactions (
      transaction_date, transaction_type, product_id, quantity,
      reference_type, reference_number, customer_id, return_id,
      return_item_id, reason, notes
    ) values (
      p_return_date, 'RETURN', p_product_id, p_quantity,
      'RETURN', v_return.return_reference, p_customer_id, v_return.id,
      v_return_item_id, p_reason, p_notes
    );
  end if;

  return v_return;
end;
$$;

grant execute on function fn_record_return(
  uuid, uuid, uuid, uuid, numeric, date, text, boolean, numeric, text
) to authenticated;
-- Products are never hard-deleted: inventory_transactions, sale_items, and
-- return_items all reference products without cascade, and a real DELETE
-- would either violate those foreign keys or destroy audit history for any
-- product that ever moved stock. "Delete" is a reasoned soft-delete instead.

alter table products
  add column deleted_at timestamptz,
  add column deletion_reason text;

create index products_deleted_at_idx on products (deleted_at);
-- Private storage bucket for the nightly backup export (see
-- src/app/api/cron/backup/route.ts). Not public: only the service role
-- (which bypasses RLS/storage policies entirely) ever touches it, so no
-- policies are needed here. Run this only in the Production project —
-- the nightly backup targets Production's data, not Test's.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

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

-- Invoicing: tax + payments. A sale now carries VAT (UAE default 5%,
-- editable per sale) and can receive one or more payments over time
-- (advance payment at sale creation, plus later top-ups). Current stock
-- stays untouched — this only adds financial fields on top of sales.

alter table sales
  add column if not exists tax_percent numeric not null default 5,
  add column if not exists tax_amount numeric not null default 0,
  add column if not exists grand_total numeric not null default 0;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_method text,
  paid_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_sale_id_idx on payments (sale_id);

alter table payments enable row level security;

drop policy if exists "Authenticated full access" on payments;
create policy "Authenticated full access" on payments
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Paid-to-date per sale, derived from the payments table (never stored) —
-- balance due = sales.grand_total - sale_payment_totals.paid_total.
create or replace view sale_payment_totals as
select sale_id, coalesce(sum(amount), 0) as paid_total
from payments
group by sale_id;

-- fn_record_sale now takes a tax rate and an optional advance payment,
-- computed/inserted atomically with the rest of the sale.
drop function if exists fn_record_sale(text, date, text, text, text, jsonb, text, text, text, text);

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
  p_customer_address text default null,
  p_tax_percent numeric default 5,
  p_advance_amount numeric default null,
  p_advance_payment_method text default null,
  p_advance_paid_on date default null
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
  v_tax_amount numeric := 0;
  v_grand_total numeric := 0;
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
    sale_date, customer_id, invoice_number, delivery_note_number, notes, tax_percent
  ) values (
    p_sale_date, v_customer_id, p_invoice_number, p_delivery_note_number, p_notes,
    coalesce(p_tax_percent, 0)
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

  v_tax_amount := round(v_total * coalesce(p_tax_percent, 0) / 100, 2);
  v_grand_total := v_total + v_tax_amount;

  update sales
  set total_amount = v_total,
      discount_total = v_discount_total,
      tax_amount = v_tax_amount,
      grand_total = v_grand_total
  where id = v_sale.id
  returning * into v_sale;

  if p_advance_amount is not null and p_advance_amount > 0 then
    insert into payments (sale_id, amount, payment_method, paid_on)
    values (
      v_sale.id,
      p_advance_amount,
      nullif(btrim(coalesce(p_advance_payment_method, '')), ''),
      coalesce(p_advance_paid_on, p_sale_date)
    );
  end if;

  return v_sale;
end;
$$;

grant execute on function fn_record_sale(
  text, date, text, text, text, jsonb, text, text, text, text, numeric, numeric, text, date
) to authenticated;

-- Sales created before migration 0009 got tax_amount/grand_total stuck at
-- their literal column default (0), since adding a column with a default
-- only backfills that column's own value, not a value computed from other
-- columns. Backfill them from the existing total_amount + tax_percent.
update sales
set tax_amount = round(total_amount * tax_percent / 100, 2),
    grand_total = total_amount + round(total_amount * tax_percent / 100, 2)
where grand_total = 0
  and total_amount <> 0;

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

alter table products
  add column if not exists vendor_name text;
