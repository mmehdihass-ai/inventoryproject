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
