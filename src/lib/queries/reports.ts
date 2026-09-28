import "server-only";
import { listSales, type SaleListFilters } from "@/lib/queries/sales";

export type CustomerSalesRow = {
  customerId: string;
  customerName: string;
  salesCount: number;
  totalAmount: number;
};

export async function getCustomerSalesReport(
  filters: SaleListFilters = {},
): Promise<CustomerSalesRow[]> {
  const sales = await listSales(filters);
  const totals = new Map<string, CustomerSalesRow>();

  for (const sale of sales) {
    const customerId = sale.customer?.id ?? sale.customer_id;
    const customerName = sale.customer?.customer_name ?? "Unknown";
    const existing = totals.get(customerId);
    if (existing) {
      existing.salesCount += 1;
      existing.totalAmount += sale.total_amount;
    } else {
      totals.set(customerId, {
        customerId,
        customerName,
        salesCount: 1,
        totalAmount: sale.total_amount,
      });
    }
  }

  return Array.from(totals.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount,
  );
}
