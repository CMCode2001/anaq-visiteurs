import type {
  ArchiveEntry,
  ArchiveEntryPosition,
  CreateArchiveEntryInput,
  PaginatedArchive,
  ResolvedArchiveQuery,
  UpdateArchiveEntryInput,
} from "@/types/archive";

/**
 * Contrat d'accès aux archives du service aux usagers.
 *
 * Le registre Word est importé une fois pour toutes ; l'application y ajoute
 * ensuite les nouvelles sollicitations, en corrige le nom ou l'adresse et
 * retire celles saisies par erreur. La place d'une ligne dans le registre
 * (année, mois, numéro) ne change jamais.
 */
export interface ArchiveRepository {
  /**
   * Ajoute une sollicitation au mois en cours. L'année, le mois et le
   * numéro de ligne sont attribués par la base, puis retournés.
   */
  create(input: CreateArchiveEntryInput): Promise<ArchiveEntryPosition>;

  /**
   * Corrige le nom et l'adresse d'une ligne. `false` si elle n'existe pas
   * (ou plus) : RLS masque une ligne interdite au lieu de lever une erreur.
   */
  update(id: string, input: UpdateArchiveEntryInput): Promise<boolean>;

  /** Suppression définitive d'une ligne. `false` si elle n'existe pas. */
  remove(id: string): Promise<boolean>;

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
