import "server-only";

import { composeArchiveName, computeArchiveStats } from "@/lib/archive";
import { EXPORT_MAX_ROWS } from "@/lib/constants";
import { getArchiveRepository } from "@/lib/repositories";
import type {
  ArchiveEntry,
  ArchiveEntryPosition,
  ArchiveQuery,
  ArchiveStats,
  PaginatedArchive,
  ResolvedArchiveQuery,
} from "@/types/archive";

/**
 * Logique métier « archives du service aux usagers ».
 * Lectures et écritures réservées aux administrateurs (protégées par RLS).
 */

/**
 * Ajoute une sollicitation reçue ce mois-ci.
 *
 * Contrairement aux visiteurs, la casse du nom est fixée au stockage : le
 * registre ne garde qu'un nom complet, prénom et nom n'y sont plus séparables.
 */
export async function addArchiveEntry(input: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<ArchiveEntryPosition> {
  const repository = await getArchiveRepository();
  return repository.create({
    fullName: composeArchiveName(input.firstName, input.lastName),
    email: input.email,
  });
}

/**
 * Corrige le nom et l'adresse d'une ligne ; `false` si elle n'existe plus.
 * Le nom est enregistré tel que saisi : c'est une correction, pas une saisie.
 */
export async function updateArchiveEntry(
  id: string,
  input: { fullName: string; email: string },
): Promise<boolean> {
  const repository = await getArchiveRepository();
  return repository.update(id, {
    fullName: input.fullName || null,
    email: input.email,
  });
}

/** Suppression définitive ; `false` si la ligne n'existe plus. */
export async function deleteArchiveEntry(id: string): Promise<boolean> {
  const repository = await getArchiveRepository();
  return repository.remove(id);
}

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
