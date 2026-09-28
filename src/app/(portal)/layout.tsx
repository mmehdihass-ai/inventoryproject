import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { listProductsWithStock } from "@/lib/queries/products";
import { listCustomers } from "@/lib/queries/customers";
import { listSalesForPicker } from "@/lib/queries/sales";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [products, customers, sales] = await Promise.all([
    listProductsWithStock({ active: true }),
    listCustomers({ active: true }),
    listSalesForPicker(),
  ]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar products={products} customers={customers} sales={sales} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar email={user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
