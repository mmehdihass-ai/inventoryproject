import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryFilters } from "@/components/products/inventory-filters";
import { ProductTable } from "@/components/products/product-table";
import { listCategories, listProducts } from "@/lib/queries/products";

export default async function InventoryPage(props: PageProps<"/inventory">) {
  const searchParams = await props.searchParams;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  const [products, categories] = await Promise.all([
    listProducts({
      search,
      category,
      active:
        status === "active" ? true : status === "inactive" ? false : undefined,
    }),
    listCategories(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/inventory/new" />}
        >
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      <InventoryFilters categories={categories} />

      <ProductTable products={products} />
    </div>
  );
}
