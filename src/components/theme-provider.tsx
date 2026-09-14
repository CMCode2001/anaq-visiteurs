"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Gestion des themes clair / sombre.
 *
 * Le choix de theme est reserve a l'espace d'administration : le formulaire
 * public reste toujours en clair, quel que soit le reglage de l'agent. Un
 * visiteur qui se presente a l'accueil doit voir la meme fiche que tout le
 * monde, et l'impression papier suppose un fond blanc.
 *
 * `forcedTheme` neutralise le reglage memorise hors de /admin, y compris lors
 * d'une navigation interne : la classe `.dark` est retiree de <html> des que
 * l'on quitte l'espace d'administration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="anaqsup-theme"
      forcedTheme={isAdminArea ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  );
}
