import { promises as fs } from "node:fs";
import path from "node:path";

import { jsPDF } from "jspdf";
import * as autoTableModule from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";

import { ORG } from "@/lib/constants";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateTime } from "@/lib/utils";
import { describePeriod } from "@/lib/validation/filters";
import type { Visitor, VisitorQuery } from "@/types/visitor";

/**
 * Génération des documents PDF (liste filtrée et fiche individuelle).
 * Exécuté côté serveur uniquement (runtime Node.js).
 */

type AutoTableFn = (doc: jsPDF, options: UserOptions) => void;

/**
 * `jspdf-autotable` est publié en CommonJS. Selon le bundler et le runtime,
 * l'export par défaut arrive soit directement, soit encapsulé dans `.default`
 * (parfois deux fois). On le déballe explicitement pour rester insensible à
 * ces différences d'interopérabilité.
 */
function resolveAutoTable(module: unknown): AutoTableFn {
  let candidate: unknown = module;

  for (let depth = 0; depth < 3; depth += 1) {
    if (typeof candidate === "function") return candidate as AutoTableFn;
    candidate = (candidate as { default?: unknown } | null | undefined)
      ?.default;
  }

  throw new Error(
    "jspdf-autotable : fonction autoTable introuvable dans le module importé.",
  );
}

const autoTable = resolveAutoTable(autoTableModule);

/** Marine institutionnel ANAQ-Sup (#042244) : bandeau d'en-tête et titres. */
const BRAND: [number, number, number] = [4, 34, 68];
const MUTED: [number, number, number] = [91, 107, 127];
/** Or ANAQ-Sup (#c29e16) : filet d'accent sous le bandeau. */
const GOLD: [number, number, number] = [194, 158, 22];

const MARGIN = 14;

/** Hauteur du logo dans le bandeau d'en-tête, en millimètres. */
const LOGO_HEIGHT_MM = 13;

/**
 * Logo officiel ANAQ-Sup, chargé depuis `public/`.
 * En cas d'absence ou de fichier illisible, un bloc typographique sobre est
 * dessiné à la place : la génération du PDF n'échoue jamais pour un logo.
 */
async function loadLogo(): Promise<{
  dataUrl: string;
  format: "PNG" | "JPEG";
} | null> {
  const candidates: Array<[string, "PNG" | "JPEG"]> = [
    ["logo-anaqsup.png", "PNG"],
    ["logo-anaqsup.jpg", "JPEG"],
    ["logo-anaqsup.jpeg", "JPEG"],
  ];

  for (const [file, format] of candidates) {
    try {
      const buffer = await fs.readFile(
        path.join(process.cwd(), "public", file),
      );
      return {
        dataUrl: `data:image/${format.toLowerCase()};base64,${buffer.toString("base64")}`,
        format,
      };
    } catch {
      // fichier absent : on essaie le suivant
    }
  }

  return null;
}

async function drawHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 26, "F");

  // Filet doré : rappel de la couleur d'accent de l'application.
  doc.setFillColor(...GOLD);
  doc.rect(0, 26, pageWidth, 1.2, "F");

  const logo = await loadLogo();
  let textLeft = MARGIN;
  let logoDrawn = false;

  if (logo) {
    try {
      // Les proportions natives du logotype sont toujours respectées.
      const properties = doc.getImageProperties(logo.dataUrl);
      const ratio =
        properties.width > 0 && properties.height > 0
          ? properties.width / properties.height
          : ORG.logoWidth / ORG.logoHeight;

      const logoWidth = LOGO_HEIGHT_MM * ratio;
      doc.addImage(
        logo.dataUrl,
        logo.format,
        MARGIN,
        (26 - LOGO_HEIGHT_MM) / 2,
        logoWidth,
        LOGO_HEIGHT_MM,
      );

      textLeft = MARGIN + logoWidth + 6;
      logoDrawn = true;
    } catch {
      // image illisible : on retombe sur l'en-tête typographique
    }
  }

  doc.setTextColor(255, 255, 255);

  if (logoDrawn) {
    // Le logotype porte déjà le sigle : on n'affiche que la dénomination.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(ORG.name, textLeft, 15, {
      maxWidth: pageWidth - textLeft - MARGIN,
    });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(ORG.shortName, textLeft, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(ORG.name, textLeft, 18);
  }

  doc.setTextColor(...BRAND);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, MARGIN, 38);
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Document interne ANAQ-Sup - données à caractère personnel",
      MARGIN,
      pageHeight - 8,
    );
    doc.text(
      `Page ${page} / ${pageCount}`,
      pageWidth - MARGIN,
      pageHeight - 8,
      { align: "right" },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Rapport : liste des visiteurs                                               */
/* -------------------------------------------------------------------------- */

export async function buildVisitorsPdf(
  visitors: Visitor[],
  query: Pick<VisitorQuery, "from" | "to" | "search" | "country" | "formation">,
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  await drawHeader(doc, "Rapport - Fiche de présence des visiteurs");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);

  const meta = [
    `Période : ${describePeriod(query.from, query.to)}`,
    `Date de génération : ${formatDateTime(new Date())}`,
    `Nombre total de visiteurs : ${visitors.length}`,
  ];

  const activeFilters = [
    query.search ? `recherche « ${query.search} »` : null,
    query.country ? `pays : ${query.country}` : null,
    query.formation ? `formation : ${query.formation}` : null,
  ].filter(Boolean);

  if (activeFilters.length > 0) {
    meta.push(`Filtres appliqués : ${activeFilters.join(" · ")}`);
  }

  meta.forEach((line, index) => doc.text(line, MARGIN, 45 + index * 5));

  autoTable(doc, {
    startY: 47 + meta.length * 5,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        "Date",
        "Prénom",
        "Nom",
        "Pays",
        "Téléphone",
        "Email",
        "Formation recherchée",
        "Consent.",
      ],
    ],
    body: visitors.map((visitor) => [
      formatDateTime(visitor.createdAt),
      visitor.firstName,
      visitor.lastName,
      visitor.country,
      formatPhoneDisplay(visitor.phone),
      visitor.email ?? "-",
      visitor.formationRequested,
      visitor.consentGiven ? "Oui" : "Non",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 247, 249] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 30 },
      5: { cellWidth: 48 },
      7: { cellWidth: 16, halign: "center" },
    },
  });

  if (visitors.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text(
      "Aucun visiteur ne correspond aux critères sélectionnés.",
      MARGIN,
      47 + meta.length * 5 + 14,
    );
  }

  drawFooter(doc);

  return Buffer.from(doc.output("arraybuffer"));
}

/* -------------------------------------------------------------------------- */
/* Fiche individuelle                                                          */
/* -------------------------------------------------------------------------- */

export async function buildVisitorSheetPdf(visitor: Visitor): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await drawHeader(doc, "Fiche visiteur");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Date de génération : ${formatDateTime(new Date())}`, MARGIN, 45);

  autoTable(doc, {
    startY: 52,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    head: [["Informations du visiteur", ""]],
    body: [
      ["Prénom", visitor.firstName],
      ["Nom", visitor.lastName],
      ["Pays d'origine", visitor.country],
      ["Téléphone", formatPhoneDisplay(visitor.phone)],
      ["Email", visitor.email ?? "-"],
      ["Formation recherchée", visitor.formationRequested],
      ["Consentement", visitor.consentGiven ? "Accordé" : "Non accordé"],
      ["Version du consentement", visitor.consentVersion ?? "-"],
      ["Date du consentement", formatDateTime(visitor.consentDate)],
      ["Date de création", formatDateTime(visitor.createdAt)],
      ["Identifiant", visitor.id],
    ],
    styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold", textColor: BRAND },
      1: { cellWidth: "auto" },
    },
  });

  drawFooter(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
