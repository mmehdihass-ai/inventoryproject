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
