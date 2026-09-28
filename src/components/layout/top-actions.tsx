"use client";

import { ShoppingCart, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StockInDialog } from "@/components/transactions/stock-in-dialog";
import { AdjustmentDialog } from "@/components/transactions/adjustment-dialog";
import type { Product } from "@/lib/types/product";

const PLACEHOLDER_ACTIONS = [
  { label: "New Sale", icon: ShoppingCart, phase: "Phase 4" },
  { label: "Return", icon: Undo2, phase: "Phase 5" },
] as const;

export function TopActions({ products }: { products: Product[] }) {
  return (
    <div className="flex items-center gap-2">
      <StockInDialog products={products} />
      <AdjustmentDialog products={products} />
      {PLACEHOLDER_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            onClick={() =>
              toast(`${action.label} arrives in ${action.phase}`, {
                description: "This form isn't wired up yet.",
              })
            }
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
