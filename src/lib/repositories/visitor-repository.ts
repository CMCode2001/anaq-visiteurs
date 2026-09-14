import type {
  PaginatedVisitors,
  Visitor,
  VisitorQuery,
  VisitorStats,
} from "@/types/visitor";

/** Données nécessaires à la création d'une fiche visiteur. */
export interface CreateVisitorInput {
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  email: string | null;
  formationRequested: string;
  consentGiven: true;
  consentVersion: string;
}

/**
 * Contrat d'accès aux données visiteurs.
 *
 * Point d'extension principal de l'architecture : l'implémentation Supabase
 * peut être remplacée par un client d'API backend classique sans toucher
 * aux pages, aux composants ni aux exports.
 */
export interface VisitorRepository {
  /**
   * Enregistre un visiteur (parcours public).
   *
   * Ne retourne rien volontairement : par principe de moindre privilège, le
   * rôle `anon` ne dispose que du privilège INSERT sur `visitors`. Relire la
   * ligne créée exigerait un GRANT SELECT, ce qui ouvrirait la table en
   * lecture au public -RLS serait alors l'unique barrière.
   */
  create(input: CreateVisitorInput): Promise<void>;

  /** Liste paginée, filtrée et triée (réservée aux administrateurs). */
  list(query: VisitorQuery): Promise<PaginatedVisitors>;

  /** Toutes les lignes correspondant aux filtres, pour l'export. */
  listAll(
    query: Omit<VisitorQuery, "page" | "pageSize">,
    max: number,
  ): Promise<Visitor[]>;

  /** Fiche détaillée, ou `null` si l'identifiant n'existe pas. */
  findById(id: string): Promise<Visitor | null>;

  /** Suppression définitive d'une fiche. */
  remove(id: string): Promise<void>;

  /** Indicateurs du tableau de bord. */
  stats(): Promise<VisitorStats>;

  /** Valeurs distinctes utilisées pour alimenter les filtres. */
  facets(): Promise<{ countries: string[]; formations: string[] }>;
}

/** Erreur métier normalisée, remontée telle quelle aux couches supérieures. */
export class VisitorRepositoryError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "VisitorRepositoryError";
  }
}
