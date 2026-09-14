import * as XLSX from "xlsx";

import { ORG } from "@/lib/constants";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateTime } from "@/lib/utils";
import { describePeriod } from "@/lib/validation/filters";
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
  "Formation recherchée",
  "Consentement",
  "Version du consentement",
  "Date du consentement",
  "Identifiant",
] as const;

const COLUMN_WIDTHS = [20, 18, 18, 20, 18, 30, 40, 14, 22, 20, 38];

export function buildVisitorsWorkbook(
  visitors: Visitor[],
  query: Pick<VisitorQuery, "from" | "to" | "search" | "country" | "formation">,
): Buffer {
  const rows = visitors.map((visitor) => [
    formatDateTime(visitor.createdAt),
    visitor.firstName,
    visitor.lastName,
    visitor.country,
    formatPhoneDisplay(visitor.phone),
    visitor.email ?? "",
    visitor.formationRequested,
    visitor.consentGiven ? "Oui" : "Non",
    visitor.consentVersion ?? "",
    formatDateTime(visitor.consentDate),
    visitor.id,
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
    ["Recherche", query.search ?? "—"],
    ["Filtre pays", query.country ?? "—"],
    ["Filtre formation", query.formation ?? "—"],
    ["Nombre total de visiteurs", visitors.length],
    [],
    ["Document interne ANAQ-Sup — contient des données à caractère personnel."],
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
