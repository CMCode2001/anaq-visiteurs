import { NextResponse, type NextRequest } from "next/server";

import { getAdminIdentity } from "@/lib/auth/guards";
import { buildArchiveWorkbook } from "@/lib/exports/excel";
import {
  archiveExportFilename,
  contentDisposition,
} from "@/lib/exports/filename";
import {
  listArchiveEntriesForExport,
  resolveArchiveQuery,
} from "@/lib/services/archives";
import { parseArchiveQuery } from "@/lib/validation/archive-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/archives/excel -liste des archives au format Excel.
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
    const workbook = buildArchiveWorkbook(entries, query);

    return new NextResponse(new Uint8Array(workbook), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDisposition(
          archiveExportFilename(query.year, "xlsx"),
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[exports/archives/excel] échec de génération", error);
    return NextResponse.json(
      { message: "La génération du fichier Excel des archives a échoué." },
      { status: 500 },
    );
  }
}
