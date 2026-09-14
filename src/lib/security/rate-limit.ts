import "server-only";

/**
 * Limiteur de débit minimaliste, en mémoire.
 *
 * Objectif V1 : freiner les soumissions répétées du formulaire public depuis
 * une même adresse IP, sans ajouter de dépendance ni de coût d'infrastructure.
 *
 * Limite connue : la mémoire n'est pas partagée entre les instances
 * serverless Vercel. Pour une protection stricte, brancher plus tard un
 * stockage partagé (Upstash Redis, Supabase, Vercel KV) derrière la même
 * fonction `checkRateLimit` -l'appelant n'aura pas à changer.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Nettoyage opportuniste pour éviter la croissance illimitée de la Map. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** Extrait une clé d'identification best-effort depuis les en-têtes. */
export function clientKey(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "inconnu";
  return ip;
}
