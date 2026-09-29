import { cookies } from "next/headers";
import { Boxes } from "lucide-react";
import { LoginForm } from "./login-form";
import { EnvSwitcher } from "@/components/layout/env-switcher";
import { ENV_COOKIE_NAME, parseEnv } from "@/lib/env-config";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const env = parseEnv(cookieStore.get(ENV_COOKIE_NAME)?.value);

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 18% 20%, oklch(0.56 0.15 38 / 0.35), transparent 55%), radial-gradient(circle at 82% 78%, oklch(0.7 0.1 80 / 0.22), transparent 50%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Inventory Portal
          </span>
        </div>
        <div className="relative space-y-3">
          <p className="text-balance font-heading text-3xl leading-tight font-medium">
            Every piece, every project, tracked from the warehouse to the
            showroom floor.
          </p>
          <p className="text-sm text-sidebar-foreground/60">
            Stock, sales, and returns — always derived from the transaction
            ledger, never guessed.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to manage inventory
              </p>
            </div>
            <EnvSwitcher env={env} />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
