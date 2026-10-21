import type { Database } from "@/types/database";
import type { CountBucket, SortDirection } from "@/types/visitor";

/** Ligne brute telle que stockée en base. */
export type ArchiveEntryRow =
  Database["public"]["Tables"]["archive_entries"]["Row"];

/**
 * Une sollicitation du service aux usagers, reprise du registre Word.
 * Un même usager peut figurer plusieurs fois : chaque ligne est un contact.
 */
export interface ArchiveEntry {
  id: string;
  year: number;
  month: number;
  /** Rang de la ligne dans la liste du mois, comme dans le registre. */
  lineNumber: number;
  fullName: string | null;
  email: string;
}

/** Colonnes sur lesquelles le tri est autorisé (liste blanche). */
export type ArchiveSortField = "month" | "full_name" | "email";

/** Critères de recherche / filtrage de la liste des archives. */
export interface ArchiveQuery {
  /** Absente de l'URL : l'année la plus récente est retenue. */
  year?: number;
  month?: number;
  search?: string;
  sort: ArchiveSortField;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

/** Critères une fois l'année résolue : ce que reçoit le repository. */
export type ResolvedArchiveQuery = ArchiveQuery & { year: number };

export interface PaginatedArchive {
  items: ArchiveEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface MonthlyArchiveCount {
  month: number;
  count: number;
  /** Adresses email différentes ce mois-ci. */
  distinctUsers: number;
}

export interface ArchiveRequester {
  /** Dernier nom connu pour l'adresse, à défaut l'adresse elle-même. */
  label: string;
  email: string;
  count: number;
  months: number[];
}

export interface ArchiveStats {
  year: number;
  total: number;
  /** Un usager est identifié par son adresse email. */
  distinctUsers: number;
  /** Usagers ayant écrit au moins deux fois dans l'année. */
  returningUsers: number;
  /** Moyenne sur les mois écoulés, de janvier au dernier mois renseigné. */
  monthlyAverage: number;
  busiestMonth: MonthlyArchiveCount | null;
  /** De janvier au dernier mois renseigné, mois vides compris. */
  monthly: MonthlyArchiveCount[];
  categories: CountBucket[];
  domains: CountBucket[];
  topRequesters: ArchiveRequester[];
}

/** Mappe une ligne SQL vers le modèle métier. */
export function toArchiveEntry(row: ArchiveEntryRow): ArchiveEntry {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    lineNumber: row.line_number,
    fullName: row.full_name,
    email: row.email,
  };
}
