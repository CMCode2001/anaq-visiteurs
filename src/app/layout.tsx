import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { ORG } from "@/lib/constants";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${ORG.formTitle} - ${ORG.shortName}`,
    template: `%s - ${ORG.shortName}`,
  },
  description: ORG.formSubtitle,
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
  themeColor: "#042244",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
