import { TransactionsFilters } from "@/components/transactions/transactions-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { listTransactions } from "@/lib/queries/transactions";
import { listProducts, listCategories } from "@/lib/queries/products";
import { listCustomers } from "@/lib/queries/customers";
import type { TransactionType } from "@/lib/types/transaction";

export default async function TransactionsPage(
  props: PageProps<"/transactions">,
) {
  const searchParams = await props.searchParams;
  const get = (key: string) =>
    typeof searchParams[key] === "string" ? searchParams[key] : undefined;

  const [transactions, products, categories, customers] = await Promise.all([
    listTransactions({
      dateFrom: get("from"),
      dateTo: get("to"),
      type: get("type") as TransactionType | undefined,
      productId: get("product"),
      category: get("category"),
      customerId: get("customer"),
      reference: get("reference"),
    }),
    listProducts(),
    listCategories(),
    listCustomers(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Transactions
      </h1>
      <TransactionsFilters
        products={products}
        categories={categories}
        customers={customers}
      />
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
