import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopHeader } from "@/components/layout/top-header";

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

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <TopHeader email={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
