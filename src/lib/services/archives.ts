import "server-only";

import { computeArchiveStats } from "@/lib/archive";
import { EXPORT_MAX_ROWS } from "@/lib/constants";
import { getArchiveRepository } from "@/lib/repositories";
import type {
  ArchiveEntry,
  ArchiveQuery,
  ArchiveStats,
  PaginatedArchive,
  ResolvedArchiveQuery,
} from "@/types/archive";

/**
 * Logique métier « archives du service aux usagers ».
 * Lectures réservées aux administrateurs (protégées par RLS).
 */

/**
 * Fixe l'année consultée : celle de l'URL si elle existe en base, à défaut
 * la plus récente. `query` vaut `null` tant qu'aucune archive n'est importée.
 */
export async function resolveArchiveQuery(query: ArchiveQuery): Promise<{
  query: ResolvedArchiveQuery | null;
  years: number[];
}> {
  const repository = await getArchiveRepository();
  const years = await repository.years();

  if (years.length === 0) return { query: null, years };

  const year =
    query.year && years.includes(query.year) ? query.year : years[0];

  return { query: { ...query, year }, years };
}

export async function listArchiveEntries(
  query: ResolvedArchiveQuery,
): Promise<PaginatedArchive> {
  const repository = await getArchiveRepository();
  return repository.list(query);
}

export async function listArchiveEntriesForExport(
  query: ResolvedArchiveQuery,
): Promise<ArchiveEntry[]> {
  const repository = await getArchiveRepository();

  // La pagination ne s'applique pas à un export : seuls les filtres comptent.
  return repository.listAll(
    {
      year: query.year,
      month: query.month,
      search: query.search,
      sort: query.sort,
      direction: query.direction,
    },
    EXPORT_MAX_ROWS,
  );
}

/** Statistiques d'une année entière, indépendamment des filtres de la liste. */
export async function getArchiveStats(year: number): Promise<ArchiveStats> {
  const repository = await getArchiveRepository();
  const entries = await repository.listAll(
    { year, sort: "month", direction: "asc" },
    EXPORT_MAX_ROWS,
  );

  return computeArchiveStats(entries, year);
}
