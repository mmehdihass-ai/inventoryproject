-- Products are never hard-deleted: inventory_transactions, sale_items, and
-- return_items all reference products without cascade, and a real DELETE
-- would either violate those foreign keys or destroy audit history for any
-- product that ever moved stock. "Delete" is a reasoned soft-delete instead.

alter table products
  add column deleted_at timestamptz,
  add column deletion_reason text;

create index products_deleted_at_idx on products (deleted_at);
