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
 * Contenu de la barre laterale : marque, navigation, compte et theme.
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
    <div className="flex h-full flex-col gap-6">
      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className="rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <BrandMark height={30} />
      </Link>

      <nav aria-label="Navigation principale" className="flex flex-col gap-1">
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
                "inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
          Formulaire public
        </a>
      </nav>

      {/* Compte et theme, ancres en bas de la barre. */}
      <div className="mt-auto space-y-3">
        <AccountMenu identity={identity} />
        <ThemeToggle />
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
            "flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 text-left transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-gold-ink"
          >
            {initials}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </span>

          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground"
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
