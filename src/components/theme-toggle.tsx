"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
] as const;

/**
 * Bascule clair / sombre en controle segmente.
 *
 * Deux boutons explicites plutot qu'un interrupteur : l'etat courant se lit
 * d'un coup d'oeil, sans avoir a deviner ce que fait l'icone. Le groupe est
 * expose comme un `radiogroup` aux technologies d'assistance.
 *
 * `onSidebar` adapte les couleurs au fond bleu de nuit de la barre laterale.
 */
export function ThemeToggle({
  className,
  onSidebar = false,
}: {
  className?: string;
  onSidebar?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Le theme n'est connu qu'au montage (il vient du localStorage) : avant
  // cela, on rend un gabarit inerte de meme taille pour eviter tout saut
  // de mise en page et tout ecart d'hydratation.
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-10 rounded-full",
          onSidebar ? "bg-sidebar-hover" : "bg-muted/60",
          className,
        )}
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l'interface"
      className={cn(
        "flex items-center gap-1 rounded-full p-1",
        onSidebar ? "bg-sidebar-hover" : "bg-muted/70",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active && "bg-primary text-primary-foreground shadow-sm",
              !active && onSidebar && "text-sidebar-muted hover:text-sidebar-foreground",
              !active && !onSidebar && "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
