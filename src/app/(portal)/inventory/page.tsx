import Link from "next/link";
import { Plus, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { InventoryFilters } from "@/components/products/inventory-filters";
import { ProductTable } from "@/components/products/product-table";
import { StockInDialog } from "@/components/transactions/stock-in-dialog";
import { AdjustmentDialog } from "@/components/transactions/adjustment-dialog";
import { listCategories, listProductsWithStock } from "@/lib/queries/products";
import type { StockStatus } from "@/lib/inventory";

const STOCK_STATUS_VALUES: StockStatus[] = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
];

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
  const stockParam =
    typeof searchParams.stock === "string" ? searchParams.stock : undefined;
  const stockStatus = STOCK_STATUS_VALUES.includes(stockParam as StockStatus)
    ? (stockParam as StockStatus)
    : undefined;

  const [products, categories, allActiveProducts] = await Promise.all([
    listProductsWithStock({
      search,
      category,
      active:
        status === "active" ? true : status === "inactive" ? false : undefined,
      stockStatus,
    }),
    listCategories(),
    listProductsWithStock({ active: true }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Inventory</h1>
        <div className="flex gap-2">
          <StockInDialog
            products={allActiveProducts}
            triggerClassName={buttonVariants({ variant: "outline", size: "sm" })}
            trigger={
              <>
                <PackagePlus className="h-4 w-4" />
                Stock In
              </>
            }
          />
          <AdjustmentDialog
            products={allActiveProducts}
            triggerClassName={buttonVariants({ variant: "outline", size: "sm" })}
            trigger={
              <>
                <SlidersHorizontal className="h-4 w-4" />
                Adjustment
              </>
            }
          />
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/inventory/new" />}
          >
            <Plus className="h-4 w-4" />
            New product
          </Button>
        </div>
      </div>

      <InventoryFilters categories={categories} />

      <ProductTable products={products} />
    </div>
  );
}
