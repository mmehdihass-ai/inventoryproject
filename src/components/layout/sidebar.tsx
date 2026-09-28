"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Undo2,
  Users,
  History,
  FileBarChart,
  Boxes,
  PackagePlus,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StockInDialog } from "@/components/transactions/stock-in-dialog";
import { AdjustmentDialog } from "@/components/transactions/adjustment-dialog";
import { NewSaleSheet } from "@/components/sales/new-sale-sheet";
import { ReturnDialog } from "@/components/returns/return-dialog";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";
import type { SalePickerRow } from "@/lib/queries/sales";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

const actionItemClass =
  "flex w-full items-center gap-2.5 rounded-lg py-1.5 pr-3 pl-9 text-left text-sm text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground";

export function Sidebar({
  products,
  customers,
  sales,
}: {
  products: ProductWithStock[];
  customers: Customer[];
  sales: SalePickerRow[];
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Boxes className="h-4 w-4" />
        </span>
        <span className="font-heading text-[1.05rem] font-semibold tracking-tight">
          Inventory Portal
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        <NavLink item={NAV_ITEMS[0]} active={isActive(NAV_ITEMS[0].href)} />

        <NavLink item={NAV_ITEMS[1]} active={isActive(NAV_ITEMS[1].href)} />
        <StockInDialog
          products={products}
          triggerClassName={actionItemClass}
          trigger={
            <>
              <PackagePlus className="h-4 w-4" />
              Stock In
            </>
          }
        />
        <AdjustmentDialog
          products={products}
          triggerClassName={actionItemClass}
          trigger={
            <>
              <SlidersHorizontal className="h-4 w-4" />
              Adjustment
            </>
          }
        />

        <NavLink item={NAV_ITEMS[2]} active={isActive(NAV_ITEMS[2].href)} />
        <NewSaleSheet
          products={products}
          customers={customers}
          triggerClassName={actionItemClass}
          trigger={
            <>
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </>
          }
        />

        <NavLink item={NAV_ITEMS[3]} active={isActive(NAV_ITEMS[3].href)} />
        <ReturnDialog
          customers={customers}
          sales={sales}
          products={products}
          triggerClassName={actionItemClass}
          trigger={
            <>
              <Undo2 className="h-4 w-4" />
              Return
            </>
          }
        />

        {NAV_ITEMS.slice(4).map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/40">
        Transaction-based inventory
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
      {item.label}
    </Link>
  );
}
