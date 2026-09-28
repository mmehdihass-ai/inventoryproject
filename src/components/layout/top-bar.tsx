import { TopActions } from "@/components/layout/top-actions";
import { UserMenu } from "@/components/layout/user-menu";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";
import type { SalePickerRow } from "@/lib/queries/sales";

export function TopBar({
  email,
  products,
  customers,
  sales,
}: {
  email: string;
  products: ProductWithStock[];
  customers: Customer[];
  sales: SalePickerRow[];
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <TopActions products={products} customers={customers} sales={sales} />
      <UserMenu email={email} />
    </header>
  );
}
