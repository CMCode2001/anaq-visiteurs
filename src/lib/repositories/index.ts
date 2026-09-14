import "server-only";

import {
  createAnonymousSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { SupabaseVisitorRepository } from "@/lib/repositories/supabase-visitor-repository";
import type { VisitorRepository } from "@/lib/repositories/visitor-repository";

/**
 * Fabriques de repositories -seul endroit de l'application qui connaît
 * l'implémentation concrète.
 *
 * Migration future vers une API backend : il suffit d'écrire un
 * `HttpVisitorRepository implements VisitorRepository` et de le retourner ici.
 */

/** Repository portant la session de l'administrateur connecté. */
export async function getVisitorRepository(): Promise<VisitorRepository> {
  const supabase = await createServerSupabaseClient();
  return new SupabaseVisitorRepository(supabase);
}

/** Repository anonyme : utilisé uniquement pour l'enregistrement public. */
export function getPublicVisitorRepository(): VisitorRepository {
  return new SupabaseVisitorRepository(createAnonymousSupabaseClient());
}

export type { VisitorRepository };
