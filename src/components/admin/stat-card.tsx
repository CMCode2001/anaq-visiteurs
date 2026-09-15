import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  /** Teinte de la pastille, pour distinguer les indicateurs d un coup d oeil. */
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
 * Composition centree et hauteur fixe : les quatre cartes d une rangee
 * s alignent au pixel, quelle que soit la longueur de leur libelle ou de leur
 * precision temporelle. Le nombre occupe le centre optique de la carte,
 * c est ce que l agent vient y chercher.
 *
 * `min-w-0` est indispensable : en tant qu element de grille, la carte a
 * `min-width: auto` et sa colonne ne peut pas descendre sous la largeur
 * minimale de son contenu.
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
      <CardContent className="flex h-[7.75rem] flex-col items-center justify-center gap-1.5 p-3 text-center">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
            TONES[tone],
          )}
        >
          {icon}
        </span>

        <p className="max-w-full truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>

        <p className="max-w-full truncate text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground">
          {NUMBER_FORMATTER.format(value)}
        </p>

        {hint ? (
          <p className="max-w-full truncate text-[11px] text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
