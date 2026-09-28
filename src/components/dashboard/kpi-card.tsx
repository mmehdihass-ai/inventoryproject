import Link from "next/link";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "critical";
}) {
  const content = (
    <Card
      className={cn(
        "transition-colors",
        href && "hover:ring-primary/30",
      )}
    >
      <CardContent className="flex items-center justify-between gap-3 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tone === "critical"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
