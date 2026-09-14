import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity } from "@/lib/auth/guards";
import {
  contentDisposition,
  visitorSheetFilename,
} from "@/lib/exports/filename";
import { buildVisitorSheetPdf } from "@/lib/exports/pdf";
import { getVisitor } from "@/lib/services/visitors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/visitors/[id]/pdf -fiche PDF individuelle.
 * Réservé aux administrateurs : vérification d'identité + RLS.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = z.string().uuid().safeParse(id);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Identifiant de visiteur invalide." },
      { status: 400 },
    );
  }

  try {
    const visitor = await getVisitor(parsed.data);

    if (!visitor) {
      return NextResponse.json(
        { message: "Visiteur introuvable." },
        { status: 404 },
      );
    }

    const pdf = await buildVisitorSheetPdf(visitor);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(
          visitorSheetFilename(visitor.firstName, visitor.lastName),
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[visitors/pdf] échec de génération", error);
    return NextResponse.json(
      { message: "La génération de la fiche PDF a échoué." },
      { status: 500 },
    );
  }
}
