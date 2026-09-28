import { TopActions } from "@/components/layout/top-actions";
import { UserMenu } from "@/components/layout/user-menu";
import type { Product } from "@/lib/types/product";

export function TopBar({
  email,
  products,
}: {
  email: string;
  products: Product[];
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <TopActions products={products} />
      <UserMenu email={email} />
    </header>
  );
}
