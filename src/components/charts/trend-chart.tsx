"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate } from "@/lib/utils";
import type { CountBucket } from "@/types/visitor";

/** Évolution du nombre de visiteurs sur les 14 derniers jours. */
export function TrendChart({ data }: { data: CountBucket[] }) {
  const chartData = data.map((bucket) => ({
    ...bucket,
    short: bucket.label.slice(8, 10) + "/" + bucket.label.slice(5, 7),
  }));

  return (
    <div
      role="img"
      aria-label="Évolution du nombre de visiteurs sur les 14 derniers jours"
      className="h-[240px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="short"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} visiteur(s)`, ""]}
            labelFormatter={(_label, payload) =>
              formatDate(payload?.[0]?.payload?.label)
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#trend-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
