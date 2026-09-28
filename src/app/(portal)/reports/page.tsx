import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ReportDateRange } from "@/components/reports/report-date-range";
import { CurrentInventoryReport } from "@/components/reports/current-inventory-report";
import { StockMovementReport } from "@/components/reports/stock-movement-report";
import { SalesReport } from "@/components/reports/sales-report";
import { CustomerSalesReport } from "@/components/reports/customer-sales-report";
import { ReturnsReport } from "@/components/reports/returns-report";
import { LowStockReport } from "@/components/reports/low-stock-report";
import { listProductsWithStock } from "@/lib/queries/products";
import { listTransactions } from "@/lib/queries/transactions";
import { listSales } from "@/lib/queries/sales";
import { listReturns } from "@/lib/queries/returns";
import { getCustomerSalesReport } from "@/lib/queries/reports";

export default async function ReportsPage(props: PageProps<"/reports">) {
  const searchParams = await props.searchParams;
  const dateFrom =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const dateTo =
    typeof searchParams.to === "string" ? searchParams.to : undefined;

  const [
    allProducts,
    stockMovement,
    sales,
    customerSales,
    returns,
    lowStockProducts,
  ] = await Promise.all([
    listProductsWithStock({}),
    listTransactions({ dateFrom, dateTo }, 500),
    listSales({ dateFrom, dateTo }),
    getCustomerSalesReport({ dateFrom, dateTo }),
    listReturns({ dateFrom, dateTo }),
    listProductsWithStock({ active: true }).then((products) =>
      products
        .filter((p) => p.stockStatus !== "IN_STOCK")
        .sort((a, b) => a.stockPcs - b.stockPcs),
    ),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Reports
      </h1>

      <ReportDateRange />

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Current inventory</TabsTrigger>
          <TabsTrigger value="movement">Stock movement</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customer-sales">Customer sales</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="low-stock">Low stock</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="pt-4">
          <CurrentInventoryReport products={allProducts} />
        </TabsContent>
        <TabsContent value="movement" className="pt-4">
          <StockMovementReport transactions={stockMovement} />
        </TabsContent>
        <TabsContent value="sales" className="pt-4">
          <SalesReport sales={sales} />
        </TabsContent>
        <TabsContent value="customer-sales" className="pt-4">
          <CustomerSalesReport rows={customerSales} />
        </TabsContent>
        <TabsContent value="returns" className="pt-4">
          <ReturnsReport returns={returns} />
        </TabsContent>
        <TabsContent value="low-stock" className="pt-4">
          <LowStockReport products={lowStockProducts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
