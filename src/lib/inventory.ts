import type { Product } from "@/lib/types/product";

export type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  OUT_OF_STOCK: "Out of stock",
  LOW_STOCK: "Low stock",
  IN_STOCK: "In stock",
};

export type StockConversions = {
  stockPcs: number;
  stockCarton: number | null;
  stockSqm: number | null;
  status: StockStatus;
};

/**
 * Derives carton/SQM quantities and stock status from a product's
 * conversion factors. Never persisted — always computed from the ledger
 * balance so it can't drift out of sync with the transaction history.
 */
export function computeStockConversions(
  product: Pick<Product, "pcs_per_carton" | "sqm_per_carton" | "reorder_level">,
  stockPcs: number,
): StockConversions {
  const stockCarton = product.pcs_per_carton
    ? stockPcs / product.pcs_per_carton
    : null;

  const stockSqm =
    product.pcs_per_carton && product.sqm_per_carton
      ? (stockPcs / product.pcs_per_carton) * product.sqm_per_carton
      : null;

  const status: StockStatus =
    stockPcs <= 0
      ? "OUT_OF_STOCK"
      : stockPcs <= product.reorder_level
        ? "LOW_STOCK"
        : "IN_STOCK";

  return { stockPcs, stockCarton, stockSqm, status };
}
