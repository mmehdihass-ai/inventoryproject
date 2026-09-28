"use client";

import { StockInDialog } from "@/components/transactions/stock-in-dialog";
import { AdjustmentDialog } from "@/components/transactions/adjustment-dialog";
import { NewSaleSheet } from "@/components/sales/new-sale-sheet";
import { ReturnDialog } from "@/components/returns/return-dialog";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";
import type { SalePickerRow } from "@/lib/queries/sales";

export function TopActions({
  products,
  customers,
  sales,
}: {
  products: ProductWithStock[];
  customers: Customer[];
  sales: SalePickerRow[];
}) {
  return (
    <div className="flex items-center gap-2">
      <StockInDialog products={products} />
      <NewSaleSheet products={products} customers={customers} />
      <ReturnDialog customers={customers} sales={sales} products={products} />
      <AdjustmentDialog products={products} />
    </div>
  );
}
