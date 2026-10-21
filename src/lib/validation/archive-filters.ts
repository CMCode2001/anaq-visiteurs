import { z } from "zod";

import { PAGE_SIZE_DEFAULT } from "@/lib/constants";
import type { RawSearchParams } from "@/lib/validation/filters";
import type { ArchiveQuery } from "@/types/archive";

/**
 * Validation des paramètres d'URL de la liste des archives.
 * Même principe que pour les visiteurs : toute valeur non reconnue est
 * ramenée à un défaut sûr (liste blanche), y compris dans les exports.
 */

export const archiveSortFields = ["month", "full_name", "email"] as const;

const archiveQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional().catch(undefined),
  month: z.coerce.number().int().min(1).max(12).optional().catch(undefined),
  search: z
    .string()
    .trim()
    .max(120)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  sort: z.enum(archiveSortFields).catch("month"),
  direction: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(PAGE_SIZE_DEFAULT),
});

/** Normalise `searchParams` (Next.js) en critères de requête typés. */
export function parseArchiveQuery(params: RawSearchParams): ArchiveQuery {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }

  return archiveQuerySchema.parse({
    year: flat.year || undefined,
    month: flat.month || undefined,
    search: flat.search ?? undefined,
    sort: flat.sort ?? "month",
    direction: flat.direction ?? "asc",
    page: flat.page ?? 1,
    pageSize: flat.pageSize ?? PAGE_SIZE_DEFAULT,
  });
}

/** Reconstruit une query string canonique (liens de tri / pagination). */
export function buildArchiveSearchParams(
  query: Partial<ArchiveQuery>,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.year) params.set("year", String(query.year));
  if (query.month) params.set("month", String(query.month));
  if (query.search) params.set("search", query.search);
  if (query.sort && query.sort !== "month") params.set("sort", query.sort);
  if (query.direction && query.direction !== "asc") {
    params.set("direction", query.direction);
  }
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== PAGE_SIZE_DEFAULT) {
    params.set("pageSize", String(query.pageSize));
  }
  return params;
}
