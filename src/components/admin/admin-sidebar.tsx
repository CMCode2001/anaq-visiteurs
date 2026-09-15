"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

import { signOutAction } from "@/app/admin/actions";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminIdentity } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/visitors", label: "Visiteurs", icon: Users },
] as const;

/**
 * Barre laterale de l'espace d'administration.
 *
 * Fond bleu de nuit dans les deux themes (jetons `--sidebar-*`) : c'est un
 * element d'identite, pas une surface de contenu. Les contrastes sont
 * verifies sur ce fond — 14,2:1 pour le texte principal, 6,1:1 pour le
 * secondaire, 6,2:1 pour le libelle marine de l'element actif.
 *
 * Le meme composant sert au rail fixe du bureau et au tiroir mobile ;
 * `onNavigate` permet a ce dernier de se refermer apres un clic.
 */
export function AdminSidebar({
  identity,
  onNavigate,
}: {
  identity: AdminIdentity;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-7 bg-sidebar text-sidebar-foreground">
      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className="rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Le logotype est dore sur fond transparent : il ressort sur le marine. */}
        <BrandMark height={30} />
      </Link>

      <nav aria-label="Navigation principale" className="flex flex-col gap-1.5">
        <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group inline-flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]"
        >
          <ExternalLink className="size-[18px] shrink-0" aria-hidden="true" />
          Formulaire public
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </nav>

      {/* Compte et theme, ancres en bas de la barre. */}
      <div className="mt-auto space-y-3">
        <AccountMenu identity={identity} />
        <ThemeToggle onSidebar />
      </div>
    </div>
  );
}

/** Carte du compte connecte, avec menu de deconnexion. */
function AccountMenu({ identity }: { identity: AdminIdentity }) {
  const displayName = identity.fullName?.trim() || identity.email;
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel =
    identity.role === "super_admin" ? "Super administrateur" : "Administrateur";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-hover px-3 py-2.5 text-left transition-colors",
            "hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {initials}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </span>
            <span className="block truncate text-xs text-sidebar-muted">
              {roleLabel}
            </span>
          </span>

          <ChevronsUpDown
            className="size-4 shrink-0 text-sidebar-muted"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-[15rem]">
        <DropdownMenuLabel>
          <span className="block truncate font-normal normal-case tracking-normal text-foreground">
            {identity.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/*
          Le formulaire enveloppe l'entree de menu : la deconnexion passe par
          une Server Action (requete POST), jamais par un lien GET, qu'un
          prefetch ou un antivirus pourrait declencher tout seul.
        */}
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="w-full text-destructive focus:text-destructive"
            >
              <LogOut aria-hidden="true" />
              Se déconnecter
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
