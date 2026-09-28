"use client";

import { PackagePlus, ShoppingCart, Undo2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { label: "Stock In", icon: PackagePlus, phase: "Phase 3" },
  { label: "New Sale", icon: ShoppingCart, phase: "Phase 4" },
  { label: "Return", icon: Undo2, phase: "Phase 5" },
  { label: "Adjustment", icon: SlidersHorizontal, phase: "Phase 3" },
] as const;

export function TopActions() {
  return (
    <div className="flex items-center gap-2">
      {ACTIONS.map((action) => {
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
