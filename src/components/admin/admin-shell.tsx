"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LayoutDashboard, LogOut, Users } from "lucide-react";

import { signOutAction } from "@/app/admin/actions";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import type { AdminIdentity } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/visitors",
    label: "Visiteurs",
    icon: Users,
  },
] as const;

/** Coquille de l'espace administrateur : navigation, identité, déconnexion. */
export function AdminShell({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const displayName = identity.fullName?.trim() || identity.email;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="shrink-0">
            <BrandMark height={32} tagline />
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                Formulaire public
              </Link>
            </Button>

            <div className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 sm:flex">
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-gold-ink"
              >
                {initials}
              </span>
              <span className="max-w-[14rem] truncate text-sm text-foreground">
                {displayName}
              </span>
            </div>

            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut aria-hidden="true" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>

        <nav
          aria-label="Navigation principale"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-gold-ink"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
