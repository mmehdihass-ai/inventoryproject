import {
  Boxes,
  Wallet,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { InventoryByCategoryChart } from "@/components/dashboard/inventory-by-category-chart";
import { TopSellingChart } from "@/components/dashboard/top-selling-chart";
import { LowStockWidget } from "@/components/dashboard/low-stock-widget";
import { RecentTransactionsWidget } from "@/components/dashboard/recent-transactions-widget";
import {
  getDashboardKpis,
  getSalesTrend,
  getInventoryByCategory,
  getTopSellingProducts,
  getRecentTransactions,
} from "@/lib/queries/dashboard";
import { listProductsWithStock } from "@/lib/queries/products";
import { formatCurrency, formatQuantity } from "@/lib/utils";

export default async function DashboardPage() {
  const [kpis, salesTrend, categoryStock, topSelling, lowStockProducts, transactions] =
    await Promise.all([
      getDashboardKpis(),
      getSalesTrend(30),
      getInventoryByCategory(),
      getTopSellingProducts(30, 7),
      listProductsWithStock({ active: true }).then((products) =>
        products
          .filter((p) => p.stockStatus !== "IN_STOCK")
          .sort((a, b) => a.stockPcs - b.stockPcs)
          .slice(0, 8),
      ),
      getRecentTransactions(10),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total stock"
          value={`${formatQuantity(kpis.totalStockPcs)} PCS`}
          href="/inventory"
          icon={Boxes}
        />
        <KpiCard
          label="Inventory value"
          value={formatCurrency(kpis.inventoryValue)}
          href="/inventory"
          icon={Wallet}
        />
        <KpiCard
          label="Sales today"
          value={formatCurrency(kpis.salesToday)}
          href="/sales"
          icon={ShoppingCart}
        />
        <KpiCard
          label="Sales this month"
          value={formatCurrency(kpis.salesThisMonth)}
          href="/sales"
          icon={TrendingUp}
        />
        <KpiCard
          label="Low stock items"
          value={String(kpis.lowStockCount)}
          href="/inventory?stock=LOW_STOCK"
          icon={AlertTriangle}
          tone={kpis.lowStockCount > 0 ? "critical" : "default"}
        />
        <KpiCard
          label="Out of stock items"
          value={String(kpis.outOfStockCount)}
          href="/inventory?stock=OUT_OF_STOCK"
          icon={XCircle}
          tone={kpis.outOfStockCount > 0 ? "critical" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales trend — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTrendChart data={salesTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by category</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryByCategoryChart data={categoryStock} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top selling products — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {topSelling.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No sales in this period.
              </div>
            ) : (
              <TopSellingChart data={topSelling} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Low stock products
          </h2>
          <LowStockWidget products={lowStockProducts} />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Recent transactions
          </h2>
          <RecentTransactionsWidget transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
