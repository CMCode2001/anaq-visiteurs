"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import type { VisitorQuery } from "@/types/visitor";

const ALL = "__all__";

interface VisitorsFiltersProps {
  query: VisitorQuery;
  countries: string[];
  formations: string[];
}

/**
 * Barre de recherche et de filtres.
 *
 * L'état vit dans l'URL : les filtres sont partageables, conservés au
 * rafraîchissement, et réutilisés tels quels par les exports Excel / PDF.
 */
export function VisitorsFilters({
  query,
  countries,
  formations,
}: VisitorsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(query.search ?? "");
  const [isPending, startTransition] = React.useTransition();

  // Synchronise le champ si l'URL change (retour arrière navigateur).
  React.useEffect(() => {
    setSearch(query.search ?? "");
  }, [query.search]);

  const pushWith = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }

      // Tout changement de filtre ramène à la première page.
      params.delete("page");

      startTransition(() => {
        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  // Recherche différée : on n'interroge le serveur qu'après une pause de saisie.
  React.useEffect(() => {
    const current = query.search ?? "";
    if (search === current) return;

    const timer = setTimeout(() => {
      pushWith({ search: search.trim() || undefined });
    }, 400);

    return () => clearTimeout(timer);
  }, [search, query.search, pushWith]);

  const hasActiveFilters = Boolean(
    query.search || query.country || query.formation || query.from || query.to,
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm no-print">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, prénom, email, téléphone, pays, formation…"
              className="pl-11"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from">Du</Label>
            <Input
              id="from"
              type="date"
              value={query.from ?? ""}
              max={query.to ?? undefined}
              onChange={(event) =>
                pushWith({ from: event.target.value || undefined })
              }
              className="lg:w-[12.5rem]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">Au</Label>
            <Input
              id="to"
              type="date"
              value={query.to ?? ""}
              min={query.from ?? undefined}
              onChange={(event) =>
                pushWith({ to: event.target.value || undefined })
              }
              className="lg:w-[12.5rem]"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="country-filter">Pays</Label>
          <Select
            value={query.country ?? ALL}
            onValueChange={(value) =>
              pushWith({ country: value === ALL ? undefined : value })
            }
          >
            <SelectTrigger id="country-filter">
              <SelectValue placeholder="Tous les pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les pays</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="formation-filter">Formation</Label>
          <Select
            value={query.formation ?? ALL}
            onValueChange={(value) =>
              pushWith({ formation: value === ALL ? undefined : value })
            }
          >
            <SelectTrigger id="formation-filter">
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les formations</SelectItem>
              {formations.map((formation) => (
                <SelectItem key={formation} value={formation}>
                  {formation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="page-size">Lignes par page</Label>
          <Select
            value={String(query.pageSize)}
            onValueChange={(value) => pushWith({ pageSize: value })}
          >
            <SelectTrigger id="page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={!hasActiveFilters || isPending}
            onClick={() =>
              pushWith({
                search: undefined,
                country: undefined,
                formation: undefined,
                from: undefined,
                to: undefined,
              })
            }
          >
            <X aria-hidden="true" />
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      {hasActiveFilters ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="size-3.5" aria-hidden="true" />
          Les filtres actifs s&apos;appliquent également aux exports Excel et
          PDF.
        </p>
      ) : null}
    </div>
  );
}
