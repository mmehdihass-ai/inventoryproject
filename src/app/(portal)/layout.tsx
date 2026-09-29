import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { TopHeader } from "@/components/layout/top-header";
import { ENV_COOKIE_NAME, parseEnv } from "@/lib/env-config";

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

  const cookieStore = await cookies();
  const env = parseEnv(cookieStore.get(ENV_COOKIE_NAME)?.value);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <TopHeader email={user.email ?? ""} env={env} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
