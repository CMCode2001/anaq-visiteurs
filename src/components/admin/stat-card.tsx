import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  /** Teinte de l'icône, pour distinguer les indicateurs d'un coup d'œil. */
  tone?: "primary" | "success" | "neutral";
}

const TONES = {
  primary: "bg-primary/20 text-gold-ink",
  success: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
} as const;

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {NUMBER_FORMATTER.format(value)}
          </p>
          {hint ? (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full [&_svg]:size-5",
            TONES[tone],
          )}
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
