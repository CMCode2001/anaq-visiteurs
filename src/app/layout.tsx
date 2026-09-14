import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ORG } from "@/lib/constants";

import "./globals.css";

/**
 * Poppins, en cinq graisses : 300 pour les mentions discretes, 400 pour le
 * texte courant, 500 et 600 pour les libelles et boutons, 700 pour les titres.
 * Police non variable : chaque graisse est un fichier, d'ou la liste explicite.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${ORG.formTitle} - ${ORG.shortName}`,
    template: `%s - ${ORG.shortName}`,
  },
  description: ORG.name,
  applicationName: `${ORG.shortName} - Visiteurs`,
  icons: { icon: ORG.logoPath, apple: ORG.logoPath },
  robots: {
    // Application interne : pas d'indexation par les moteurs de recherche.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#061829" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `suppressHydrationWarning` : next-themes inscrit la classe de theme sur
    // <html> avant l'hydratation, ce qui cree un ecart attendu avec le HTML
    // rendu cote serveur.
    <html lang="fr" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
