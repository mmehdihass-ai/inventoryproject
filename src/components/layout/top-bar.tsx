import { TopActions } from "@/components/layout/top-actions";
import { UserMenu } from "@/components/layout/user-menu";

export function TopBar({ email }: { email: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <TopActions />
      <UserMenu email={email} />
    </header>
  );
}
