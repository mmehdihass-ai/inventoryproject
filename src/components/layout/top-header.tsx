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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";
import { EnvSwitcher } from "@/components/layout/env-switcher";
import { GlobalSearch } from "@/components/layout/global-search";
import type { SupabaseEnv } from "@/lib/env-config";
import { COMPANY_NAME } from "@/lib/company";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

export function TopHeader({
  email,
  env,
}: {
  email: string;
  env: SupabaseEnv;
}) {
  const pathname = usePathname();

  return (
    <header className="bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="h-4 w-4" />
          </span>
          <h1
            className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg"
            title={COMPANY_NAME}
          >
            {COMPANY_NAME}
          </h1>
        </div>
        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EnvSwitcher env={env} />
          <UserMenu email={email} variant="dark" />
        </div>
      </div>
      <nav className="flex items-center gap-1 border-t border-sidebar-border px-4 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn("h-4 w-4", active && "text-sidebar-primary")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
