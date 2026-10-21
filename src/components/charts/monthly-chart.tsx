"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { monthLabel, monthShortLabel } from "@/lib/archive";
import type { MonthlyArchiveCount } from "@/types/archive";

/**
 * Volume mensuel des sollicitations : une seule série, donc une seule
 * couleur et pas de légende — le titre de la carte la nomme.
 */
export function MonthlyChart({
  data,
  year,
}: {
  data: MonthlyArchiveCount[];
  year: number;
}) {
  const chartData = data.map((bucket) => ({
    ...bucket,
    short: monthShortLabel(bucket.month),
  }));

  return (
    <div
      role="img"
      aria-label={`Nombre de sollicitations par mois en ${year}`}
      className="h-[260px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          barCategoryGap="22%"
        >
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
            // Sur téléphone, douze libellés ne tiennent pas : recharts saute
            // ceux qui se chevaucheraient, l'infobulle nomme chaque barre.
            interval="preserveStartEnd"
            minTickGap={6}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
              fontSize: 12,
            }}
            formatter={(value: number, _name, item) => [
              `${value} sollicitation${value > 1 ? "s" : ""} · ${item.payload.distinctUsers} usager${item.payload.distinctUsers > 1 ? "s" : ""}`,
              "",
            ]}
            labelFormatter={(_label, payload) =>
              `${monthLabel(payload?.[0]?.payload?.month)} ${year}`
            }
          />
          <Bar
            dataKey="count"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
