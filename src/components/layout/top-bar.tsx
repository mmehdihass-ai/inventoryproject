import { UserMenu } from "@/components/layout/user-menu";

const COMPANY_NAME = "AL Tareeq AL Sahal Building Materials Trading FZE";

export function TopBar({ email }: { email: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-6">
      <h1
        className="min-w-0 truncate font-heading text-base font-semibold tracking-tight sm:text-lg"
        title={COMPANY_NAME}
      >
        {COMPANY_NAME}
      </h1>
      <UserMenu email={email} />
    </header>
  );
}
