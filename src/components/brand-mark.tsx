import Image from "next/image";

import { LOGO_RATIO, ORG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** Hauteur du logo en pixels ; la largeur suit les proportions natives. */
  height?: number;
  className?: string;
  /** Affiche le nom de l'application à droite du logo, séparé d'un filet. */
  tagline?: boolean;
}

/**
 * Logo officiel ANAQ-Sup.
 *
 * Il s'agit d'un logotype horizontal : les proportions natives
 * ({@link ORG.logoWidth} × {@link ORG.logoHeight}) sont toujours respectées.
 * Pour changer de logo, remplacer `public/logo-anaqsup.png` et ajuster
 * `logoWidth` / `logoHeight` dans `src/lib/constants.ts`.
 */
export function BrandMark({
  height = 38,
  className,
  tagline = false,
}: BrandMarkProps) {
  const width = Math.round(height * LOGO_RATIO);

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src={ORG.logoPath}
        alt={`Logo ${ORG.shortName}`}
        width={width}
        height={height}
        priority
        sizes={`${width}px`}
      />

      {tagline ? (
        <span className="hidden border-l border-border pl-3 text-sm font-medium leading-tight text-muted-foreground sm:block">
          Fiche de présence
          <br />
          des visiteurs
        </span>
      ) : null}
    </span>
  );
}
