import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  ArchiveRepositoryError,
  type ArchiveRepository,
} from "@/lib/repositories/archive-repository";
import type { Database } from "@/types/database";
import {
  toArchiveEntry,
  type ArchiveEntry,
  type ArchiveEntryPosition,
  type ArchiveEntryRow,
  type CreateArchiveEntryInput,
  type PaginatedArchive,
  type ResolvedArchiveQuery,
  type UpdateArchiveEntryInput,
} from "@/types/archive";

type Client = SupabaseClient<Database>;

const COLUMNS = "id, year, month, line_number, full_name, email, created_at";

/**
 * Supabase plafonne chaque réponse de l'API à 1 000 lignes par défaut.
 * Les lectures complètes (exports, statistiques) avancent donc par pages.
 */
const BATCH_SIZE = 1_000;

/**
 * Implémentation Supabase du contrat `ArchiveRepository`.
 * Lecture et écritures sont réservées aux administrateurs par RLS.
 */
export class SupabaseArchiveRepository implements ArchiveRepository {
  constructor(private readonly client: Client) {}

  async create(input: CreateArchiveEntryInput): Promise<ArchiveEntryPosition> {
    // Ni année, ni mois, ni numéro : le trigger de la migration 0006 les pose.
    const { data, error } = await this.client
      .from("archive_entries")
      .insert({ full_name: input.fullName, email: input.email })
      .select("year, month, line_number")
      .single();

    if (error || !data) {
      throw new ArchiveRepositoryError(
        "Impossible d'ajouter la sollicitation.",
        error,
      );
    }

    return { year: data.year, month: data.month, lineNumber: data.line_number };
  }

  async update(id: string, input: UpdateArchiveEntryInput): Promise<boolean> {
    // `select` après l'écriture : seul moyen de savoir si une ligne a
    // réellement changé, RLS ne signalant pas une ligne qu'il a masquée.
    const { data, error } = await this.client
      .from("archive_entries")
      .update({ full_name: input.fullName, email: input.email })
      .eq("id", id)
      .select("id");

    if (error) {
      throw new ArchiveRepositoryError(
        "Impossible de modifier la sollicitation.",
        error,
      );
    }

    return (data?.length ?? 0) > 0;
  }

  async remove(id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("archive_entries")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      throw new ArchiveRepositoryError(
        "Impossible de supprimer la sollicitation.",
        error,
      );
    }

    return (data?.length ?? 0) > 0;
  }

  async list(query: ResolvedArchiveQuery): Promise<PaginatedArchive> {
    const page = Math.max(1, query.page);
    const pageSize = query.pageSize;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await applyOrder(
      applyFilters(
        this.client
          .from("archive_entries")
          .select(COLUMNS, { count: "exact" }),
        query,
      ),
      query,
    ).range(offset, offset + pageSize - 1);

    if (error) {
      throw new ArchiveRepositoryError(
        "Impossible de charger les archives.",
        error,
      );
    }

    const total = count ?? 0;

    return {
      items: (data as ArchiveEntryRow[] | null)?.map(toArchiveEntry) ?? [],
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async listAll(
    query: Omit<ResolvedArchiveQuery, "page" | "pageSize">,
    max: number,
  ): Promise<ArchiveEntry[]> {
    const entries: ArchiveEntry[] = [];

    while (entries.length < max) {
      const from = entries.length;
      const to = Math.min(from + BATCH_SIZE, max) - 1;

      const { data, error } = await applyOrder(
        applyFilters(this.client.from("archive_entries").select(COLUMNS), query),
        query,
      ).range(from, to);

      if (error) {
        throw new ArchiveRepositoryError(
          "Impossible de préparer l'export des archives.",
          error,
        );
      }

      const rows = (data as ArchiveEntryRow[] | null) ?? [];
      entries.push(...rows.map(toArchiveEntry));
      if (rows.length < to - from + 1) break;
    }

    return entries;
  }

  async years(): Promise<number[]> {
    // PostgREST n'offre pas de DISTINCT : on descend d'année en année, une
    // requête d'une ligne par année, plutôt que de lire toute la table.
    const years: number[] = [];
    let below: number | undefined;

    for (;;) {
      let request = this.client
        .from("archive_entries")
        .select("year")
        .order("year", { ascending: false })
        .limit(1);

      if (below !== undefined) request = request.lt("year", below);

      const { data, error } = await request;

      if (error) {
        // Migration 0005 pas encore exécutée : l'écran l'explique, plutôt
        // que de tomber sur la page d'erreur générique.
        if (isMissingTable(error)) return [];
        throw new ArchiveRepositoryError(
          "Impossible de lister les années archivées.",
          error,
        );
      }

      const year = data?.[0]?.year;
      if (year === undefined) return years;

      years.push(year);
      below = year;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Sous-ensemble structurel de PostgrestFilterBuilder réellement utilisé ici. */
interface FilterableQuery<Self> {
  eq(column: string, value: number): Self;
  or(filters: string): Self;
  order(
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean },
  ): Self;
}

function applyFilters<T extends FilterableQuery<T>>(
  builder: T,
  query: Omit<ResolvedArchiveQuery, "page" | "pageSize">,
): T {
  let request = builder.eq("year", query.year);

  if (query.month) request = request.eq("month", query.month);

  if (query.search) {
    const term = sanitizePattern(query.search);
    if (term) {
      request = request.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%`,
      );
    }
  }

  return request;
}

/** Tri demandé, puis ordre du registre pour départager les égalités. */
function applyOrder<T extends FilterableQuery<T>>(
  builder: T,
  query: Pick<ResolvedArchiveQuery, "sort" | "direction">,
): T {
  const ascending = query.direction === "asc";
  let request = builder;

  if (query.sort !== "month") {
    request = request.order(query.sort, { ascending, nullsFirst: false });
  }

  return request
    .order("month", { ascending: query.sort === "month" ? ascending : true })
    .order("line_number", {
      ascending: query.sort === "month" ? ascending : true,
    });
}

/**
 * Neutralise les caractères qui ont une signification dans la grammaire de
 * filtres PostgREST (`,` `(` `)`) ou dans les motifs LIKE (`%` `_` `\`).
 */
function sanitizePattern(value: string) {
  return value
    .replace(/[\\%_,()*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function isMissingTable(error: PostgrestError) {
  return error.code === "42P01" || error.code === "PGRST205";
}
