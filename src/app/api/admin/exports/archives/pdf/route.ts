import { NextResponse, type NextRequest } from "next/server";

import { getAdminIdentity } from "@/lib/auth/guards";
import {
  archiveExportFilename,
  contentDisposition,
} from "@/lib/exports/filename";
import { buildArchivePdf } from "@/lib/exports/pdf";
import {
  listArchiveEntriesForExport,
  resolveArchiveQuery,
} from "@/lib/services/archives";
import { parseArchiveQuery } from "@/lib/validation/archive-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/archives/pdf -liste des archives au format PDF.
 * Année, mois et recherche de l'écran sont appliqués à l'export.
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

    const entries = await listArchiveEntriesForExport(query);
    const pdf = await buildArchivePdf(entries, query);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(
          archiveExportFilename(query.year, "pdf"),
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[exports/archives/pdf] échec de génération", error);
    return NextResponse.json(
      { message: "La génération du PDF des archives a échoué." },
      { status: 500 },
    );
  }
}
