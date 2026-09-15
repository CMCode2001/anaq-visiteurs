import { z } from "zod";

import { PAGE_SIZE_DEFAULT } from "@/lib/constants";
import type { VisitorQuery } from "@/types/visitor";

/**
 * Validation des paramètres d'URL de la liste administrateur.
 * Sert aussi bien aux Server Components qu'aux routes d'export :
 * toute valeur non reconnue est ramenée à un défaut sûr (liste blanche),
 * ce qui empêche toute injection dans les clauses `order` / `ilike`.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export const visitorSortFields = [
  "created_at",
  "last_name",
  "first_name",
  "country",
  "formation_requested",
] as const;

const optionalText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .catch(undefined)
  .transform((value) => (value ? value : undefined));

const optionalDay = z
  .string()
  .trim()
  .regex(ISO_DAY)
  .optional()
  .catch(undefined)
  .transform((value) => (value ? value : undefined));

export const visitorQuerySchema = z.object({
  search: optionalText,
  country: optionalText,
  formation: optionalText,
  from: optionalDay,
  to: optionalDay,
  sort: z.enum(visitorSortFields).catch("created_at"),
  direction: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(PAGE_SIZE_DEFAULT),
});

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Normalise `searchParams` (Next.js) en critères de requête typés. */
export function parseVisitorQuery(params: RawSearchParams): VisitorQuery {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }

  const parsed = visitorQuerySchema.parse({
    search: flat.search ?? undefined,
    country: flat.country ?? undefined,
    formation: flat.formation ?? undefined,
    from: flat.from ?? undefined,
    to: flat.to ?? undefined,
    sort: flat.sort ?? "created_at",
    direction: flat.direction ?? "desc",
    page: flat.page ?? 1,
    pageSize: flat.pageSize ?? PAGE_SIZE_DEFAULT,
  });

  // Un intervalle inversé est corrigé plutôt que rejeté (UX plus tolérante).
  if (parsed.from && parsed.to && parsed.from > parsed.to) {
    return { ...parsed, from: parsed.to, to: parsed.from };
  }

  return parsed;
}

/** Reconstruit une query string canonique (liens de tri / pagination). */
export function buildVisitorSearchParams(
  query: Partial<VisitorQuery>,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.country) params.set("country", query.country);
  if (query.formation) params.set("formation", query.formation);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.sort && query.sort !== "created_at") params.set("sort", query.sort);
  if (query.direction && query.direction !== "desc") {
    params.set("direction", query.direction);
  }
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== PAGE_SIZE_DEFAULT) {
    params.set("pageSize", String(query.pageSize));
  }
  return params;
}

/** Libellé lisible de la période retenue (en-tête des exports PDF). */
export function describePeriod(from?: string, to?: string) {
  if (from && to) return `du ${formatDay(from)} au ${formatDay(to)}`;
  if (from) return `à partir du ${formatDay(from)}`;
  if (to) return `jusqu'au ${formatDay(to)}`;
  return "toutes périodes confondues";
}

function formatDay(isoDay: string) {
  const [year, month, day] = isoDay.split("-");
  return `${day}/${month}/${year}`;
}

/* -------------------------------------------------------------------------- */
/* Raccourcis de période                                                       */
/* -------------------------------------------------------------------------- */

export type PeriodPreset = "today" | "week" | "month" | "all";

/** Bornes d'un raccourci, en jours UTC (« YYYY-MM-DD »). */
export function periodRange(preset: PeriodPreset): {
  from?: string;
  to?: string;
} {
  if (preset === "all") return {};

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = day(today);

  if (preset === "today") return { from: to, to };

  if (preset === "week") {
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return { from: day(start), to };
  }

  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return { from: day(start), to };
}

/** Quel raccourci correspond exactement à l'intervalle courant ? */
export function matchPeriodPreset(
  from?: string,
  to?: string,
): PeriodPreset | null {
  for (const preset of ["today", "week", "month", "all"] as const) {
    const range = periodRange(preset);
    if (range.from === from && range.to === to) return preset;
  }
  return null;
}

function day(date: Date) {
  return date.toISOString().slice(0, 10);
}
