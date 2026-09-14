"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Gestion des themes clair / sombre.
 *
 * `attribute="class"` pose la classe `.dark` sur <html>, ce que la palette de
 * `globals.css` attend. Le choix est conserve dans le localStorage du poste,
 * et un script inline injecte par next-themes l'applique avant le premier
 * rendu : pas de flash blanc au chargement en mode sombre.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="anaqsup-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
