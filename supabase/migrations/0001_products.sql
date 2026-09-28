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
