"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/chart-theme";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { formatQuantity, formatCompactNumber } from "@/lib/utils";
import type { TopSellingProduct } from "@/lib/queries/dashboard";

function truncate(label: string, max = 22) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function TopSellingChart({ data }: { data: TopSellingProduct[] }) {
  const chartData = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke={CHART_COLORS.grid}
          strokeDasharray="0"
        />
        <XAxis
          type="number"
          tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
          tickFormatter={(value) => formatCompactNumber(value)}
        />
        <YAxis
          type="category"
          dataKey="label"
          tickFormatter={(value) => truncate(String(value))}
          tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={150}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.grid, opacity: 0.3 }}
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              label={payload?.[0]?.payload?.label}
              value={payload?.[0]?.value as number | undefined}
              formatValue={(v) => `${formatQuantity(v)} sold`}
            />
          )}
        />
        <Bar
          dataKey="quantitySold"
          fill={CHART_COLORS.mark}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
