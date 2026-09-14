import { toIsoDay } from "@/lib/utils";

/**
 * Nommage normalisé des fichiers exportés.
 *   visiteurs_anaqsup_2026-09-14.xlsx
 *   visiteurs_anaqsup_2026-09-14.pdf
 *   fiche_visiteur_diallo_awa_2026-09-14.pdf
 */

export function visitorsExportFilename(extension: "xlsx" | "pdf") {
  return `visiteurs_anaqsup_${toIsoDay()}.${extension}`;
}

export function visitorSheetFilename(firstName: string, lastName: string) {
  const slug = [lastName, firstName]
    .map(slugify)
    .filter(Boolean)
    .join("_");
  return `fiche_visiteur_${slug || "anaqsup"}_${toIsoDay()}.pdf`;
}

/** En-tête HTTP téléchargement, avec repli ASCII pour les vieux clients. */
export function contentDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(
    filename,
  )}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
