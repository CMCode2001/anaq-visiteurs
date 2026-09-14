import { NextResponse, type NextRequest } from "next/server";

import { getAdminIdentity } from "@/lib/auth/guards";
import { buildVisitorsWorkbook } from "@/lib/exports/excel";
import {
  contentDisposition,
  visitorsExportFilename,
} from "@/lib/exports/filename";
import { listVisitorsForExport } from "@/lib/services/visitors";
import { parseVisitorQuery } from "@/lib/validation/filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/excel -export Excel des visiteurs.
 *
 * Les filtres actifs de la liste (recherche, pays, formation, période) sont
 * transmis dans la query string et appliqués à l'export.
 * Réservé aux administrateurs : vérification d'identité + RLS.
 */
export async function GET(request: NextRequest) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  const query = parseVisitorQuery(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  try {
    const visitors = await listVisitorsForExport(query);
    const workbook = buildVisitorsWorkbook(visitors, query);

    return new NextResponse(new Uint8Array(workbook), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDisposition(
          visitorsExportFilename("xlsx"),
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[exports/excel] échec de génération", error);
    return NextResponse.json(
      { message: "La génération du fichier Excel a échoué." },
      { status: 500 },
    );
  }
}
