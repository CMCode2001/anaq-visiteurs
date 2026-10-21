"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

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
import { monthLabel, monthShortLabel } from "@/lib/archive";
import { cn } from "@/lib/utils";
import type { MonthlyArchiveCount, ResolvedArchiveQuery } from "@/types/archive";

interface ArchiveFiltersProps {
  query: ResolvedArchiveQuery;
  years: number[];
  /** Volume de chaque mois, affiché sur sa pastille. */
  months: MonthlyArchiveCount[];
}

/**
 * Recherche et filtres de la liste des archives.
 *
 * Le registre est tenu mois par mois : le mois est donc le filtre principal,
 * en pastilles portant chacune son volume. L'année n'apparaît que lorsque
 * plusieurs registres ont été importés.
 */
export function ArchiveFilters({ query, years, months }: ArchiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(query.search ?? "");
  const [isPending, startTransition] = React.useTransition();

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

  const total = months.reduce((sum, month) => sum + month.count, 0);
  const hasActiveFilters = Boolean(query.search || query.month);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm no-print">
      <div
        className={cn(
          "grid gap-4",
          years.length > 1 && "lg:grid-cols-[minmax(0,1fr)_12rem]",
        )}
      >
        <div className="min-w-0 space-y-2">
          <Label htmlFor="archive-search">Recherche</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="archive-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou adresse email…"
              className="pl-11"
            />
          </div>
        </div>

        {years.length > 1 ? (
          <div className="min-w-0 space-y-2">
            <Label htmlFor="archive-year">Année</Label>
            <Select
              value={String(query.year)}
              onValueChange={(value) =>
                // Les mois d'une année n'ont pas de sens dans une autre.
                pushWith({ year: value, month: undefined })
              }
            >
              <SelectTrigger id="archive-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-medium text-foreground">Mois</p>

        <div className="flex flex-wrap items-center gap-2">
          <MonthChip
            label="Tous"
            count={total}
            active={!query.month}
            disabled={isPending}
            onClick={() => pushWith({ month: undefined })}
          />

          {months.map((month) => (
            <MonthChip
              key={month.month}
              label={monthShortLabel(month.month)}
              title={monthLabel(month.month)}
              count={month.count}
              active={query.month === month.month}
              disabled={isPending || month.count === 0}
              onClick={() => pushWith({ month: String(month.month) })}
            />
          ))}

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => pushWith({ search: undefined, month: undefined })}
              className="ml-auto"
            >
              <X aria-hidden="true" />
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </div>

      {hasActiveFilters ? (
        <p className="text-xs text-muted-foreground">
          Les filtres actifs s’appliquent également aux exports Excel et PDF.
        </p>
      ) : null}
    </div>
  );
}

function MonthChip({
  label,
  title,
  count,
  active,
  disabled,
  onClick,
}: {
  label: string;
  title?: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "text-xs tabular-nums",
          active ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
