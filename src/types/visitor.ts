import type { Database } from "@/types/database";

/** Ligne brute telle que stockée en base. */
export type VisitorRow = Database["public"]["Tables"]["visitors"]["Row"];

/** Payload d'insertion accepté par la base. */
export type VisitorInsert = Database["public"]["Tables"]["visitors"]["Insert"];

/**
 * Représentation métier d'un visiteur utilisée dans toute l'application.
 * Découplée volontairement de la ligne SQL : si l'on remplace un jour Supabase
 * par une API backend classique, seul le mapper change.
 */
export interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  email: string | null;
  formationRequested: string;
  /** Etablissement sur lequel porte la recherche du visiteur (facultatif). */
  establishment: string | null;
  consentGiven: boolean;
  consentDate: string | null;
  consentVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Colonnes sur lesquelles le tri est autorisé (liste blanche). */
export type VisitorSortField =
  | "created_at"
  | "last_name"
  | "first_name"
  | "country"
  | "establishment"
  | "formation_requested";

export type SortDirection = "asc" | "desc";

/** Critères de recherche / filtrage de la liste administrateur. */
export interface VisitorQuery {
  search?: string;
  country?: string;
  formation?: string;
  from?: string; // ISO date (début de journée incluse)
  to?: string; // ISO date (fin de journée incluse)
  sort: VisitorSortField;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export interface PaginatedVisitors {
  items: Visitor[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface VisitorStats {
  total: number;
  today: number;
  week: number;
  month: number;
  topFormations: CountBucket[];
  topCountries: CountBucket[];
  dailyTrend: CountBucket[];
}

/** Mappe une ligne SQL vers le modèle métier. */
export function toVisitor(row: VisitorRow): Visitor {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    country: row.country,
    phone: row.phone,
    email: row.email,
    formationRequested: row.formation_requested,
    establishment: row.establishment,
    consentGiven: row.consent_given,
    consentDate: row.consent_date,
    consentVersion: row.consent_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
