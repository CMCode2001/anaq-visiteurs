import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit, clientKey } from "@/lib/security/rate-limit";
import { registerVisitor } from "@/lib/services/visitors";
import { visitorFormSchema } from "@/lib/validation/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/visitors -enregistrement public d'une fiche de présence.
 *
 * Sécurité :
 *   - revalidation intégrale de la charge utile avec le schéma Zod ;
 *   - consentement et horodatage imposés côté serveur ;
 *   - limitation de débit par adresse IP ;
 *   - insertion via un client Supabase strictement anonyme, autorisée par
 *     la policy RLS `visitors_public_insert` (aucune lecture possible).
 */
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(
    `visitors:${clientKey(request.headers)}`,
    10,
    60_000,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        message:
          "Trop de demandes envoyées depuis ce poste. Merci de patienter quelques instants.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  const parsed = visitorFormSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Certaines informations sont invalides.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    await registerVisitor(parsed.data);

    // Réponse volontairement minimale : aucune donnée personnelle renvoyée.
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[api/visitors] échec de l'enregistrement", error);
    return NextResponse.json(
      {
        message:
          "L'enregistrement a échoué. Veuillez réessayer ou vous adresser à l'accueil.",
      },
      { status: 500 },
    );
  }
}
