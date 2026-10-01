-- Sales created before migration 0009 got tax_amount/grand_total stuck at
-- their literal column default (0), since adding a column with a default
-- only backfills that column's own value, not a value computed from other
-- columns. Backfill them from the existing total_amount + tax_percent.
update sales
set tax_amount = round(total_amount * tax_percent / 100, 2),
    grand_total = total_amount + round(total_amount * tax_percent / 100, 2)
where grand_total = 0
  and total_amount <> 0;
