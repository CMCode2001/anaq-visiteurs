import { NextResponse, type NextRequest } from "next/server";

import { getAdminIdentity } from "@/lib/auth/guards";
import {
  archiveStatsFilename,
  contentDisposition,
} from "@/lib/exports/filename";
import { buildArchiveStatsPdf } from "@/lib/exports/pdf";
import { getArchiveStats, resolveArchiveQuery } from "@/lib/services/archives";
import { parseArchiveQuery } from "@/lib/validation/archive-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/archives/stats -rapport statistique PDF d'une année.
 * Réservé aux administrateurs : vérification d'identité + RLS.
 */
export async function GET(request: NextRequest) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  try {
    const { query } = await resolveArchiveQuery(
      parseArchiveQuery(Object.fromEntries(request.nextUrl.searchParams)),
    );
    if (!query) {
      return NextResponse.json(
        { message: "Aucune archive n'a encore été importée." },
        { status: 404 },
      );
    }

    const stats = await getArchiveStats(query.year);
    const pdf = await buildArchiveStatsPdf(stats);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(
          archiveStatsFilename(query.year),
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[exports/archives/stats] échec de génération", error);
    return NextResponse.json(
      { message: "La génération du rapport statistique a échoué." },
      { status: 500 },
    );
  }
}
