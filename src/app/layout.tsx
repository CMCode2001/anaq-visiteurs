import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

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
  icons: {
    // Le favicon fourni est blanc sur fond transparent : invisible sur une
    // barre d'onglets claire. On sert donc la variante sur fond marine aux
    // navigateurs en theme clair, et l'original aux themes sombres.
    icon: [
      { url: ORG.faviconLight, media: "(prefers-color-scheme: light)" },
      { url: ORG.faviconDark, media: "(prefers-color-scheme: dark)" },
    ],
    // Ecran d'accueil iOS : pas de transparence, toujours le fond marine.
    apple: ORG.faviconLight,
  },
  robots: {
    // Application interne : pas d'indexation par les moteurs de recherche.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7f9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
