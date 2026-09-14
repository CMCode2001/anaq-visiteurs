"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CountBucket } from "@/types/visitor";
import { truncate } from "@/lib/utils";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Classement horizontal (formations recherchées, pays d'origine).
 * Barres horizontales : les libellés longs restent lisibles.
 */
export function RankingChart({
  data,
  ariaLabel,
}: {
  data: CountBucket[];
  ariaLabel: string;
}) {
  const chartData = data.map((bucket) => ({
    ...bucket,
    short: truncate(bucket.label, 22),
  }));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{ height: Math.max(180, chartData.length * 42) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="short"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} visiteur(s)`, ""]}
            labelFormatter={(_label, payload) =>
              payload?.[0]?.payload?.label ?? ""
            }
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={PALETTE[index % PALETTE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
