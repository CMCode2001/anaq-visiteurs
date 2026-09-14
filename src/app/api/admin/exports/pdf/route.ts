import { NextResponse, type NextRequest } from "next/server";

import { getAdminIdentity } from "@/lib/auth/guards";
import {
  contentDisposition,
  visitorsExportFilename,
} from "@/lib/exports/filename";
import { buildVisitorsPdf } from "@/lib/exports/pdf";
import { listVisitorsForExport } from "@/lib/services/visitors";
import { parseVisitorQuery } from "@/lib/validation/filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/exports/pdf -rapport PDF de la liste filtrée.
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
    const pdf = await buildVisitorsPdf(visitors, query);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(
          visitorsExportFilename("pdf"),
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[exports/pdf] échec de génération", error);
    return NextResponse.json(
      { message: "La génération du rapport PDF a échoué." },
      { status: 500 },
    );
  }
}
