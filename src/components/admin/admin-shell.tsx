"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { AdminSidebar, NAV_ITEMS } from "@/components/admin/admin-sidebar";
import { BrandMark } from "@/components/brand-mark";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AdminIdentity } from "@/lib/auth/guards";
import { ORG } from "@/lib/constants";

/**
 * Coquille de l'espace d'administration.
 *
 * Bureau : rail lateral fixe a gauche, contenu a droite.
 * Mobile : barre superieure avec un tiroir coulissant, meme navigation.
 */
export function AdminShell({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Le tiroir se referme des que la route change.
  React.useEffect(() => setDrawerOpen(false), [pathname]);

  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* ---------------------------- Bureau ---------------------------- */}
      <aside className="sticky top-0 hidden h-dvh w-[17rem] shrink-0 border-r border-border bg-card px-4 py-5 lg:block no-print">
        <AdminSidebar identity={identity} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---------------------------- Mobile ---------------------------- */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden no-print">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">Ouvrir le menu de navigation</span>
              </button>
            </SheetTrigger>

            <SheetContent>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Accès au tableau de bord, aux visiteurs et au compte.
              </SheetDescription>
              <AdminSidebar
                identity={identity}
                onNavigate={() => setDrawerOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <BrandMark height={26} />

          <span className="ml-auto truncate text-sm font-medium text-muted-foreground">
            {current?.label}
          </span>
        </header>

        {/* Bandeau institutionnel : la denomination complete de l'ANAQ. */}
        <div className="hidden border-b border-border bg-card/60 px-6 py-2.5 lg:block no-print">
          <p className="text-xs font-light text-muted-foreground">{ORG.name}</p>
        </div>

        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
