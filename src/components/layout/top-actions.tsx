"use client";

import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StockInDialog } from "@/components/transactions/stock-in-dialog";
import { AdjustmentDialog } from "@/components/transactions/adjustment-dialog";
import { NewSaleSheet } from "@/components/sales/new-sale-sheet";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";

export function TopActions({
  products,
  customers,
}: {
  products: ProductWithStock[];
  customers: Customer[];
}) {
  return (
    <div className="flex items-center gap-2">
      <StockInDialog products={products} />
      <NewSaleSheet products={products} customers={customers} />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast("Return arrives in Phase 5", {
            description: "This form isn't wired up yet.",
          })
        }
      >
        <Undo2 className="h-4 w-4" />
        Return
      </Button>
      <AdjustmentDialog products={products} />
    </div>
  );
}
