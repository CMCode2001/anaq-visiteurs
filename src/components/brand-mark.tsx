import Image from "next/image";

import { LOGO_RATIO, ORG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** Hauteur du logo en pixels ; la largeur suit les proportions natives. */
  height?: number;
  className?: string;
  /** Affiche la denomination officielle a cote du logo. */
  tagline?: boolean;
  /** Empile le libelle sous le logo plutot qu'a sa droite (barre laterale). */
  stacked?: boolean;
}

/**
 * Logo officiel ANAQ-Sup.
 *
 * Logotype horizontal : les proportions natives ({@link ORG.logoWidth} x
 * {@link ORG.logoHeight}) sont toujours respectees. Pour changer de logo,
 * remplacer `public/logo-anaqsup.png` et ajuster `logoWidth` / `logoHeight`
 * dans `src/lib/constants.ts`.
 */
export function BrandMark({
  height = 38,
  className,
  tagline = false,
  stacked = false,
}: BrandMarkProps) {
  const width = Math.round(height * LOGO_RATIO);

  return (
    <span
      className={cn(
        "inline-flex",
        stacked
          ? "flex-col items-start gap-2"
          : // Sur telephone, le libelle passe sous le logo : cote a cote, il ne
            // resterait qu'une poignee de caracteres par ligne.
            "flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3",
        className,
      )}
    >
      <Image
        src={ORG.logoPath}
        alt={`Logo ${ORG.shortName}`}
        width={width}
        height={height}
        priority
        sizes={`${width}px`}
      />

      {tagline ? (
        <span
          className={cn(
            "block text-[11px] font-light leading-snug text-muted-foreground",
            stacked ? "" : "sm:max-w-[26rem] sm:border-l sm:border-border sm:pl-3",
          )}
        >
          {/*
            Denomination complete sur grand ecran, forme abregee sur mobile :
            la phrase officielle occuperait quatre lignes sur un telephone.
          */}
          <span className="hidden lg:inline">{ORG.name}</span>
          <span className="lg:hidden">{ORG.nameCompact}</span>
        </span>
      ) : null}
    </span>
  );
}
