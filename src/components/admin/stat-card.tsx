import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  /** Teinte de la pastille, pour distinguer les indicateurs d'un coup d'oeil. */
  tone?: "gold" | "navy" | "success" | "neutral";
}

const TONES = {
  gold: "bg-primary/20 text-gold-ink",
  navy: "bg-navy/10 text-navy",
  success: "bg-success/12 text-success",
  neutral: "bg-muted text-muted-foreground",
} as const;

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

/**
 * Indicateur chiffre.
 *
 * Le nombre domine la carte : c'est ce que l'agent cherche. Le libelle est
 * au-dessus en petites capitales, la precision temporelle en dessous — cet
 * ordre evite d'avoir a relire la carte pour savoir ce que le chiffre compte.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "gold",
}: StatCardProps) {
  return (
    <Card className="min-w-0 transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-3xl font-bold leading-none tracking-tight tabular-nums text-foreground">
            {NUMBER_FORMATTER.format(value)}
          </p>
          {hint ? (
            <p className="truncate pt-0.5 text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl [&_svg]:size-[18px]",
            TONES[tone],
          )}
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
