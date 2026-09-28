"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/chart-theme";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { formatQuantity, formatCompactNumber } from "@/lib/utils";
import type { CategoryStock } from "@/lib/queries/dashboard";

export function InventoryByCategoryChart({ data }: { data: CategoryStock[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke={CHART_COLORS.grid}
          strokeDasharray="0"
        />
        <XAxis
          dataKey="category"
          tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatCompactNumber(value)}
          width={44}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.grid, opacity: 0.3 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={String(label)}
              value={payload?.[0]?.value as number | undefined}
              formatValue={(v) => `${formatQuantity(v)} PCS`}
            />
          )}
        />
        <Bar dataKey="stockPcs" fill={CHART_COLORS.mark} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
