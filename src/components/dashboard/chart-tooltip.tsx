import { CHART_COLORS } from "@/lib/chart-theme";

export function ChartTooltip({
  active,
  label,
  value,
  formatValue,
}: {
  active?: boolean;
  label?: string;
  value?: number;
  formatValue: (value: number) => string;
}) {
  if (!active || value === undefined) return null;

  return (
    <div
      className="rounded-md border px-3 py-2 text-sm shadow-md"
      style={{ background: CHART_COLORS.surface, borderColor: CHART_COLORS.grid }}
    >
      <p className="font-semibold" style={{ color: CHART_COLORS.text }}>
        {formatValue(value)}
      </p>
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
