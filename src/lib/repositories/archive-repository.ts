import type {
  ArchiveEntry,
  PaginatedArchive,
  ResolvedArchiveQuery,
} from "@/types/archive";

/**
 * Contrat d'accès aux archives du service aux usagers.
 *
 * Lecture seule : les archives sont importées une fois pour toutes depuis le
 * registre Word, l'application ne les modifie jamais.
 */
export interface ArchiveRepository {
  /** Liste paginée, filtrée et triée. */
  list(query: ResolvedArchiveQuery): Promise<PaginatedArchive>;

  /** Toutes les lignes correspondant aux filtres (exports, statistiques). */
  listAll(
    query: Omit<ResolvedArchiveQuery, "page" | "pageSize">,
    max: number,
  ): Promise<ArchiveEntry[]>;

  /**
   * Années disponibles, de la plus récente à la plus ancienne.
   * Vide si aucune archive n'a encore été importée.
   */
  years(): Promise<number[]>;
}

export class ArchiveRepositoryError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ArchiveRepositoryError";
  }
}
