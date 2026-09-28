import { TopActions } from "@/components/layout/top-actions";
import { UserMenu } from "@/components/layout/user-menu";
import type { ProductWithStock } from "@/lib/queries/products";
import type { Customer } from "@/lib/types/customer";

export function TopBar({
  email,
  products,
  customers,
}: {
  email: string;
  products: ProductWithStock[];
  customers: Customer[];
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <TopActions products={products} customers={customers} />
      <UserMenu email={email} />
    </header>
  );
}
