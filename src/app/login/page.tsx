import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Inventory Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage inventory
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
