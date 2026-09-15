"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

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
import { countryCodeFromName, flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";
import {
  matchPeriodPreset,
  periodRange,
  type PeriodPreset,
} from "@/lib/validation/filters";
import type { VisitorQuery } from "@/types/visitor";

const ALL = "__all__";

const PERIODS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "today", label: "Aujourd’hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois-ci" },
];

interface VisitorsFiltersProps {
  query: VisitorQuery;
  countries: string[];
}

/**
 * Recherche et filtres de la liste des visiteurs.
 *
 * Trois filtres seulement, ceux qu’un agent d’accueil utilise réellement :
 * la recherche libre, la période et le pays.
 *
 * Le filtre « formation » a été retiré : c’est un champ de saisie libre aux
 * valeurs trop dispersées pour une liste déroulante exploitable, et la
 * recherche textuelle le couvre déjà. Le nombre de lignes par page n’est pas
 * un filtre : il a rejoint la pagination.
 *
 * La période passe par des raccourcis plutôt que par deux sélecteurs de date :
 * « aujourd’hui » et « cette semaine » répondent à l’essentiel des besoins,
 * l’intervalle précis restant accessible d’un clic.
 */
export function VisitorsFilters({ query, countries }: VisitorsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(query.search ?? "");
  const [customPeriod, setCustomPeriod] = React.useState(
    () => matchPeriodPreset(query.from, query.to) === null,
  );
  const [isPending, startTransition] = React.useTransition();

  // Synchronise le champ si l’URL change (retour arrière navigateur).
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

  // Recherche différée : on n’interroge le serveur qu’après une pause de saisie.
  React.useEffect(() => {
    const current = query.search ?? "";
    if (search === current) return;

    const timer = setTimeout(() => {
      pushWith({ search: search.trim() || undefined });
    }, 400);

    return () => clearTimeout(timer);
  }, [search, query.search, pushWith]);

  const activePreset = matchPeriodPreset(query.from, query.to);
  const hasActiveFilters = Boolean(
    query.search || query.country || query.from || query.to,
  );

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm no-print">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-2">
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
              placeholder="Nom, prénom, email, téléphone, formation…"
              className="pl-11"
            />
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="country-filter">Pays d’origine</Label>
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
                  <CountryOption name={country} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-medium text-foreground">Période</p>

        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((period) => {
            const active = !customPeriod && activePreset === period.value;

            return (
              <button
                key={period.value}
                type="button"
                aria-pressed={active}
                disabled={isPending}
                onClick={() => {
                  setCustomPeriod(false);
                  const range = periodRange(period.value);
                  pushWith({ from: range.from, to: range.to });
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {period.label}
              </button>
            );
          })}

          <button
            type="button"
            aria-pressed={customPeriod}
            onClick={() => setCustomPeriod((current) => !current)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              customPeriod
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Personnalisée
          </button>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setCustomPeriod(false);
                pushWith({
                  search: undefined,
                  country: undefined,
                  from: undefined,
                  to: undefined,
                });
              }}
              className="ml-auto"
            >
              <X aria-hidden="true" />
              Réinitialiser
            </Button>
          ) : null}
        </div>

        {customPeriod ? (
          <div className="grid gap-3 pt-1 sm:max-w-md sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="from">Du</Label>
              <Input
                id="from"
                type="date"
                value={query.from ?? ""}
                max={query.to ?? undefined}
                onChange={(event) =>
                  pushWith({ from: event.target.value || undefined })
                }
              />
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="to">Au</Label>
              <Input
                id="to"
                type="date"
                value={query.to ?? ""}
                min={query.from ?? undefined}
                onChange={(event) =>
                  pushWith({ to: event.target.value || undefined })
                }
              />
            </div>
          </div>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <p className="text-xs text-muted-foreground">
          Les filtres actifs s’appliquent également aux exports Excel et PDF.
        </p>
      ) : null}
    </div>
  );
}

/** Drapeau et libellé, pour reconnaître un pays sans le lire entièrement. */
function CountryOption({ name }: { name: string }) {
  const code = countryCodeFromName(name);

  return (
    <span className="flex items-center gap-2">
      {code ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagUrl(code)}
          alt=""
          aria-hidden="true"
          width={20}
          height={14}
          loading="lazy"
          className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10"
        />
      ) : null}
      <span className="truncate">{name}</span>
    </span>
  );
}
