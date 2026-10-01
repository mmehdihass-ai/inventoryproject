-- A soft-deleted product's Item Number was still blocking reuse, since the
-- plain unique constraint applies across every row including deleted ones.
-- Deleted products keep their full history under their own id regardless
-- of sku, so once a product is deleted its Item Number is free again for a
-- genuinely new product. Uniqueness now only applies among active/visible
-- products (deleted_at is null) — never allows two non-deleted products to
-- share an Item Number.
alter table products drop constraint products_sku_key;

create unique index products_sku_active_unique_idx
  on products (sku)
  where deleted_at is null;
