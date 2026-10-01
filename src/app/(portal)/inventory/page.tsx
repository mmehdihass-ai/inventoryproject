import Link from "next/link";
import { Plus, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { InventoryFilters } from "@/components/products/inventory-filters";
import { ProductTable } from "@/components/products/product-table";
import { Pagination } from "@/components/ui/pagination";
import { StockInDialog } from "@/components/transactions/stock-in-dialog";
import { AdjustmentDialog } from "@/components/transactions/adjustment-dialog";
import { ProductImportDialog } from "@/components/products/product-import-dialog";
import {
  listCategories,
  listProductsWithStock,
  listProductsWithStockPaged,
} from "@/lib/queries/products";
import type { StockStatus } from "@/lib/inventory";

const PAGE_SIZE = 50;

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
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [
    { rows: products, totalCount, totalPages, page: currentPage },
    categories,
    allActiveProducts,
  ] = await Promise.all([
    listProductsWithStockPaged(
      {
        search,
        category,
        active:
          status === "active" ? true : status === "inactive" ? false : undefined,
        stockStatus,
      },
      page,
      PAGE_SIZE,
    ),
    listCategories(),
    listProductsWithStock({ active: true }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Inventory</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/inventory/new" />}
          >
            <Plus className="h-4 w-4" />
            New Product
          </Button>
          <ProductImportDialog />
          <StockInDialog
            products={allActiveProducts}
            triggerClassName={buttonVariants({ size: "sm" })}
            trigger={
              <>
                <PackagePlus className="h-4 w-4" />
                Stock In
              </>
            }
          />
          <AdjustmentDialog
            products={allActiveProducts}
            triggerClassName={buttonVariants({ size: "sm" })}
            trigger={
              <>
                <SlidersHorizontal className="h-4 w-4" />
                Adjustment
              </>
            }
          />
        </div>
      </div>

      <InventoryFilters categories={categories} />

      <ProductTable
        products={products}
        startIndex={(currentPage - 1) * PAGE_SIZE}
      />
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
