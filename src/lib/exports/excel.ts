import * as XLSX from "xlsx";

import {
  describeArchiveScope,
  emailDomain,
  monthLabel,
  senderCategory,
} from "@/lib/archive";
import { ORG } from "@/lib/constants";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  formatDateTime,
  formatFirstName,
  formatLastName,
} from "@/lib/utils";
import { describePeriod } from "@/lib/validation/filters";
import type { ArchiveEntry, ResolvedArchiveQuery } from "@/types/archive";
import type { Visitor, VisitorQuery } from "@/types/visitor";

/**
 * Génération du classeur Excel.
 *
 * Le fichier contient deux feuilles :
 *   « Visiteurs » -une ligne par visiteur, en-têtes figés et auto-filtre ;
 *   « Informations » -contexte de l'export (période, filtres, total).
 */

const HEADERS = [
  "Date d'enregistrement",
  "Prénom",
  "Nom",
  "Pays d'origine",
  "Téléphone",
  "Email",
  "Établissement concerné",
  "Formation recherchée",
  "Consentement",
] as const;

const COLUMN_WIDTHS = [20, 18, 18, 20, 18, 30, 34, 40, 14];

export function buildVisitorsWorkbook(
  visitors: Visitor[],
  query: Pick<VisitorQuery, "from" | "to" | "search" | "country" | "formation">,
): Buffer {
  const rows = visitors.map((visitor) => [
    formatDateTime(visitor.createdAt),
    formatFirstName(visitor.firstName),
    formatLastName(visitor.lastName),
    visitor.country,
    formatPhoneDisplay(visitor.phone),
    visitor.email ?? "",
    visitor.establishment ?? "",
    visitor.formationRequested,
    visitor.consentGiven ? "Oui" : "Non",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([[...HEADERS], ...rows]);
  sheet["!cols"] = COLUMN_WIDTHS.map((width) => ({ wch: width }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: HEADERS.length - 1 },
    }),
  };

  const info = XLSX.utils.aoa_to_sheet([
    [ORG.formTitle],
    [ORG.name],
    [],
    ["Date de génération", formatDateTime(new Date())],
    ["Période", describePeriod(query.from, query.to)],
    ["Recherche", query.search ?? "-"],
    ["Filtre pays", query.country ?? "-"],
    ["Filtre formation", query.formation ?? "-"],
    ["Nombre total de visiteurs", visitors.length],
    [],
    ["Document interne ANAQ-Sup - contient des données à caractère personnel."],
  ]);
  info["!cols"] = [{ wch: 28 }, { wch: 52 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Visiteurs");
  XLSX.utils.book_append_sheet(workbook, info, "Informations");

  workbook.Props = {
    Title: "Liste des visiteurs ANAQ-Sup",
    Subject: ORG.formTitle,
    Author: ORG.shortName,
    CreatedDate: new Date(),
  };

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/* -------------------------------------------------------------------------- */
/* Archives du service aux usagers                                             */
/* -------------------------------------------------------------------------- */

const ARCHIVE_HEADERS = [
  "Année",
  "Mois",
  "N°",
  "Nom de l'usager",
  "Email",
  "Domaine",
  "Catégorie",
] as const;

const ARCHIVE_COLUMN_WIDTHS = [8, 12, 6, 34, 40, 24, 22];

export function buildArchiveWorkbook(
  entries: ArchiveEntry[],
  query: Pick<ResolvedArchiveQuery, "year" | "month" | "search">,
): Buffer {
  const rows = entries.map((entry) => [
    entry.year,
    monthLabel(entry.month),
    entry.lineNumber,
    entry.fullName ?? "",
    entry.email,
    emailDomain(entry.email),
    senderCategory(entry.email),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([[...ARCHIVE_HEADERS], ...rows]);
  sheet["!cols"] = ARCHIVE_COLUMN_WIDTHS.map((width) => ({ wch: width }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: ARCHIVE_HEADERS.length - 1 },
    }),
  };

  const info = XLSX.utils.aoa_to_sheet([
    [`Archives - Service aux usagers ${query.year}`],
    [ORG.name],
    [],
    ["Date de génération", formatDateTime(new Date())],
    ["Période", describeArchiveScope(query.year, query.month)],
    ["Recherche", query.search ?? "-"],
    ["Nombre de sollicitations", entries.length],
    [
      "Usagers distincts (par adresse email)",
      new Set(entries.map((entry) => entry.email)).size,
    ],
    [],
    ["Document interne ANAQ-Sup - contient des données à caractère personnel."],
  ]);
  info["!cols"] = [{ wch: 36 }, { wch: 44 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Archives");
  XLSX.utils.book_append_sheet(workbook, info, "Informations");

  workbook.Props = {
    Title: `Archives du service aux usagers ${query.year}`,
    Subject: "Service aux usagers",
    Author: ORG.shortName,
    CreatedDate: new Date(),
  };

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
