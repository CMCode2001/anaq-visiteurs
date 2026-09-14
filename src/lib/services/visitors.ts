import "server-only";

import { CONSENT_VERSION, EXPORT_MAX_ROWS } from "@/lib/constants";
import {
  getPublicVisitorRepository,
  getVisitorRepository,
} from "@/lib/repositories";
import type { VisitorFormValues } from "@/lib/validation/visitor";
import type {
  PaginatedVisitors,
  Visitor,
  VisitorQuery,
  VisitorStats,
} from "@/types/visitor";

/**
 * Logique métier « visiteurs ».
 *
 * Les pages et les routes API ne parlent qu'à ce module : elles ignorent
 * totalement que les données viennent de Supabase.
 */

/**
 * Enregistre un visiteur depuis le formulaire public.
 *
 * Le consentement est horodaté et versionné côté serveur : le client ne peut
 * ni antidater son consentement, ni en falsifier la version.
 */
export async function registerVisitor(data: VisitorFormValues): Promise<void> {
  const repository = getPublicVisitorRepository();

  await repository.create({
    firstName: data.firstName,
    lastName: data.lastName,
    country: data.country,
    phone: data.phone,
    email: data.email || null,
    formationRequested: data.formationRequested,
    consentGiven: true,
    consentVersion: CONSENT_VERSION,
  });
}

/* --- Lectures réservées aux administrateurs (protégées par RLS) ----------- */

export async function listVisitors(
  query: VisitorQuery,
): Promise<PaginatedVisitors> {
  const repository = await getVisitorRepository();
  return repository.list(query);
}

export async function listVisitorsForExport(
  query: VisitorQuery,
): Promise<Visitor[]> {
  const repository = await getVisitorRepository();

  // La pagination ne s'applique pas à un export : seuls les filtres comptent.
  return repository.listAll(
    {
      search: query.search,
      country: query.country,
      formation: query.formation,
      from: query.from,
      to: query.to,
      sort: query.sort,
      direction: query.direction,
    },
    EXPORT_MAX_ROWS,
  );
}

export async function getVisitor(id: string): Promise<Visitor | null> {
  const repository = await getVisitorRepository();
  return repository.findById(id);
}

export async function deleteVisitor(id: string): Promise<void> {
  const repository = await getVisitorRepository();
  await repository.remove(id);
}

export async function getVisitorStats(): Promise<VisitorStats> {
  const repository = await getVisitorRepository();
  return repository.stats();
}

export async function getVisitorFacets() {
  const repository = await getVisitorRepository();
  return repository.facets();
}
