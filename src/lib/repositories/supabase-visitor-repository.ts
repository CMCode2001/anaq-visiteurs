import type { SupabaseClient } from "@supabase/supabase-js";

import {
  VisitorRepositoryError,
  type CreateVisitorInput,
  type VisitorRepository,
} from "@/lib/repositories/visitor-repository";
import type { Database } from "@/types/database";
import {
  toVisitor,
  type CountBucket,
  type PaginatedVisitors,
  type Visitor,
  type VisitorQuery,
  type VisitorRow,
  type VisitorStats,
} from "@/types/visitor";

type Client = SupabaseClient<Database>;

/** Colonnes sélectionnées : jamais `select('*')`, pour garder un contrat stable. */
const COLUMNS =
  "id, first_name, last_name, country, phone, email, formation_requested, " +
  "consent_given, consent_date, consent_version, created_at, updated_at";

/** Nombre de lignes analysées pour les agrégats du tableau de bord. */
const STATS_SAMPLE = 5_000;

/** Nombre de lignes analysées pour alimenter les listes déroulantes de filtres. */
const FACETS_SAMPLE = 2_000;

/**
 * Implémentation Supabase du contrat `VisitorRepository`.
 *
 * Toutes les requêtes s'exécutent avec l'identité de l'appelant : la
 * séparation public / administrateur est garantie par RLS, pas par ce code.
 */
export class SupabaseVisitorRepository implements VisitorRepository {
  constructor(private readonly client: Client) {}

  async create(input: CreateVisitorInput): Promise<void> {
    // Pas de `.select()` après l'insertion : sans clause RETURNING, PostgREST
    // envoie `Prefer: return=minimal` et n'exige aucun privilège de lecture.
    const { error } = await this.client
      .from("visitors")
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        country: input.country,
        phone: input.phone,
        email: input.email,
        formation_requested: input.formationRequested,
        consent_given: input.consentGiven,
        consent_version: input.consentVersion,
        // created_at / updated_at / consent_date sont posés par les triggers
        // PostgreSQL : les horodatages viennent toujours du serveur.
      });

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible d'enregistrer le visiteur.",
        error,
      );
    }
  }

  async list(query: VisitorQuery): Promise<PaginatedVisitors> {
    const page = Math.max(1, query.page);
    const pageSize = query.pageSize;
    const offset = (page - 1) * pageSize;

    const request = applyFilters(
      this.client.from("visitors").select(COLUMNS, { count: "exact" }),
      query,
    )
      .order(query.sort, { ascending: query.direction === "asc" })
      .order("id", { ascending: true }) // tri stable en cas d'égalité
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await request;

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de charger la liste des visiteurs.",
        error,
      );
    }

    const total = count ?? 0;

    return {
      items: (data as unknown as VisitorRow[] | null)?.map(toVisitor) ?? [],
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async listAll(
    query: Omit<VisitorQuery, "page" | "pageSize">,
    max: number,
  ): Promise<Visitor[]> {
    const { data, error } = await applyFilters(
      this.client.from("visitors").select(COLUMNS),
      query,
    )
      .order(query.sort, { ascending: query.direction === "asc" })
      .order("id", { ascending: true })
      .limit(max);

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de préparer l'export des visiteurs.",
        error,
      );
    }

    return (data as unknown as VisitorRow[] | null)?.map(toVisitor) ?? [];
  }

  async findById(id: string): Promise<Visitor | null> {
    const { data, error } = await this.client
      .from("visitors")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de charger la fiche du visiteur.",
        error,
      );
    }

    return data ? toVisitor(data as unknown as VisitorRow) : null;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("visitors").delete().eq("id", id);

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de supprimer la fiche du visiteur.",
        error,
      );
    }
  }

  async stats(): Promise<VisitorStats> {
    const now = new Date();
    const startOfToday = startOfDayUtc(now);
    const startOfWeek = startOfWeekUtc(now);
    const startOfMonth = startOfMonthUtc(now);

    const [total, today, week, month] = await Promise.all([
      this.count(),
      this.count(startOfToday),
      this.count(startOfWeek),
      this.count(startOfMonth),
    ]);

    // Agrégats calculés sur un échantillon des enregistrements les plus
    // récents : suffisant pour la V1 et sans coût serveur supplémentaire.
    const { data, error } = await this.client
      .from("visitors")
      .select("country, formation_requested, created_at")
      .order("created_at", { ascending: false })
      .limit(STATS_SAMPLE);

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de calculer les statistiques.",
        error,
      );
    }

    const rows = data ?? [];

    return {
      total,
      today,
      week,
      month,
      topFormations: topBuckets(rows.map((row) => row.formation_requested), 6),
      topCountries: topBuckets(rows.map((row) => row.country), 6),
      dailyTrend: dailyTrend(
        rows.map((row) => row.created_at),
        14,
      ),
    };
  }

  async facets(): Promise<{ countries: string[]; formations: string[] }> {
    const { data, error } = await this.client
      .from("visitors")
      .select("country, formation_requested")
      .order("created_at", { ascending: false })
      .limit(FACETS_SAMPLE);

    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de charger les filtres disponibles.",
        error,
      );
    }

    const countries = new Set<string>();
    const formations = new Set<string>();
    for (const row of data ?? []) {
      if (row.country) countries.add(row.country);
      if (row.formation_requested) formations.add(row.formation_requested);
    }

    const collator = new Intl.Collator("fr");
    return {
      countries: [...countries].sort(collator.compare),
      formations: [...formations].sort(collator.compare),
    };
  }

  private async count(since?: Date): Promise<number> {
    let request = this.client
      .from("visitors")
      .select("id", { count: "exact", head: true });

    if (since) {
      request = request.gte("created_at", since.toISOString());
    }

    const { count, error } = await request;
    if (error) {
      throw new VisitorRepositoryError(
        "Impossible de compter les visiteurs.",
        error,
      );
    }
    return count ?? 0;
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sous-ensemble structurel de PostgrestFilterBuilder réellement utilisé ici.
 * Déclaré localement pour ne pas dépendre des génériques internes de
 * postgrest-js, qui changent d'une version à l'autre.
 */
interface FilterableQuery<Self> {
  or(filters: string): Self;
  ilike(column: string, pattern: string): Self;
  gte(column: string, value: string): Self;
  lte(column: string, value: string): Self;
}

/**
 * Applique les filtres de recherche communs à la liste et aux exports.
 * Les valeurs sont assainies avant d'entrer dans les clauses PostgREST.
 */
function applyFilters<T extends FilterableQuery<T>>(
  builder: T,
  query: Omit<VisitorQuery, "page" | "pageSize">,
): T {
  let request = builder;

  if (query.search) {
    const term = sanitizePattern(query.search);
    if (term) {
      request = request.or(
        [
          `first_name.ilike.%${term}%`,
          `last_name.ilike.%${term}%`,
          `email.ilike.%${term}%`,
          `phone.ilike.%${term}%`,
          `country.ilike.%${term}%`,
          `formation_requested.ilike.%${term}%`,
        ].join(","),
      );
    }
  }

  if (query.country) {
    request = request.ilike("country", sanitizePattern(query.country));
  }

  if (query.formation) {
    request = request.ilike(
      "formation_requested",
      `%${sanitizePattern(query.formation)}%`,
    );
  }

  if (query.from) {
    request = request.gte("created_at", `${query.from}T00:00:00.000Z`);
  }

  if (query.to) {
    request = request.lte("created_at", `${query.to}T23:59:59.999Z`);
  }

  return request;
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

function startOfDayUtc(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Semaine ISO : commence le lundi. */
function startOfWeekUtc(date: Date) {
  const start = startOfDayUtc(date);
  const weekday = (start.getUTCDay() + 6) % 7; // lundi = 0
  start.setUTCDate(start.getUTCDate() - weekday);
  return start;
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function topBuckets(values: string[], limit: number): CountBucket[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = raw?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"))
    .slice(0, limit);
}

/** Nombre de visiteurs par jour sur les `days` derniers jours (UTC). */
function dailyTrend(timestamps: string[], days: number): CountBucket[] {
  const buckets = new Map<string, number>();
  const today = startOfDayUtc(new Date());

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  for (const timestamp of timestamps) {
    const day = timestamp?.slice(0, 10);
    if (day && buckets.has(day)) {
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([label, count]) => ({ label, count }));
}
