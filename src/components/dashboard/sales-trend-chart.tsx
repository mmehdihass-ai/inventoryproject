"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-theme";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import type { SalesTrendPoint } from "@/lib/queries/dashboard";

function formatDateTick(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-AE", { month: "short", day: "numeric" });
}

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke={CHART_COLORS.grid}
          strokeDasharray="0"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateTick}
          tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatCompactNumber(value)}
          width={50}
        />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.grid }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={formatDateTick(String(label))}
              value={payload?.[0]?.value as number | undefined}
              formatValue={formatCurrency}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={CHART_COLORS.mark}
          strokeWidth={2}
          fill={CHART_COLORS.mark}
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
