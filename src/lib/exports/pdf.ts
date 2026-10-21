import { promises as fs } from "node:fs";
import path from "node:path";

import { jsPDF } from "jspdf";
import * as autoTableModule from "jspdf-autotable";
import type { CellHookData, UserOptions } from "jspdf-autotable";

import {
  describeArchiveScope,
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
import type {
  ArchiveEntry,
  ArchiveStats,
  ResolvedArchiveQuery,
} from "@/types/archive";
import type { Visitor, VisitorQuery } from "@/types/visitor";

/**
 * Génération des documents PDF : liste filtrée et fiche individuelle des
 * visiteurs, liste et statistiques des archives du service aux usagers.
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

/**
 * Retire les signes diacritiques avant ecriture dans le PDF.
 *
 * jsPDF ecrit le texte en WinAnsi avec les polices standard, sans embarquer
 * de fichier de police ni de table d'encodage explicite. Les visionneuses
 * rendent alors les octets accentues de facon erratique : « Senegal »
 * apparaissait lettre par lettre, « Guinee (Republique) » tronque.
 *
 * On produit donc un PDF strictement ASCII. C'est une perte typographique
 * assumee, limitee aux exports PDF : l'ecran, l'export Excel et la base
 * conservent les accents.
 *
 * La solution sans compromis serait d'embarquer une police Unicode complete
 * (environ 300 Ko dans le bundle serveur) et de l'enregistrer via
 * `doc.addFileToVFS` puis `doc.addFont`.
 */
function ascii(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/[^ -~]/g, "");
}

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

/**
 * Dessine le bandeau institutionnel. Appele pour chaque page du rapport :
 * un document de plusieurs pages doit porter son en-tete partout, pas
 * seulement sur la premiere feuille.
 */
type Logo = { dataUrl: string; format: "PNG" | "JPEG" } | null;

function drawHeader(doc: jsPDF, title: string, logo: Logo) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 26, "F");

  // Filet doré : rappel de la couleur d'accent de l'application.
  doc.setFillColor(...GOLD);
  doc.rect(0, 26, pageWidth, 1.2, "F");

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
    doc.text(ascii(ORG.name), textLeft, 15, {
      maxWidth: pageWidth - textLeft - MARGIN,
    });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(ascii(ORG.shortName), textLeft, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(ascii(ORG.name), textLeft, 18);
  }

  doc.setTextColor(...BRAND);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(ascii(title), MARGIN, 38);
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
  const logo = await loadLogo();
  const title = "Rapport - Fiche de présence des visiteurs";

  drawHeader(doc, title, logo);

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

  meta.forEach((line, index) => doc.text(ascii(line), MARGIN, 45 + index * 5));

  autoTable(doc, {
    startY: 47 + meta.length * 5,
    // `top` reserve la hauteur du bandeau sur les pages suivantes.
    margin: { left: MARGIN, right: MARGIN, top: 34 },
    // Un rapport de plusieurs pages doit porter son en-tete sur chacune.
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(doc, title, logo);
    },
    head: [
      [
        "Prénom",
        "Nom",
        "Pays",
        "Établissement",
        "Téléphone",
        "Email",
        "Formation recherchée",
      ].map(ascii),
    ],
    body: visitors.map((visitor) =>
      [
        formatFirstName(visitor.firstName),
        formatLastName(visitor.lastName),
        visitor.country,
        visitor.establishment ?? "-",
        formatPhoneDisplay(visitor.phone),
        visitor.email ?? "-",
        visitor.formationRequested,
      ].map(ascii),
    ),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 247, 249] },
    // A4 paysage : 297 mm moins 28 mm de marges = 269 mm repartis ci-dessous.
    //
    // La colonne Pays fait 44 mm pour une raison precise : autoTable ne coupe
    // que sur les espaces, et « Papouasie-Nouvelle-Guinee » mesure 36,5 mm en
    // un seul mot insecable. Sous 42 mm, ce nom sortait de sa cellule.
    // Mesure faite sur les 250 pays du referentiel.
    columnStyles: {
      0: { cellWidth: 26 }, // Prenom
      1: { cellWidth: 26 }, // Nom
      2: { cellWidth: 44 }, // Pays
      3: { cellWidth: 42 }, // Etablissement
      4: { cellWidth: 30 }, // Telephone
      5: { cellWidth: 46 }, // Email
      6: { cellWidth: "auto" }, // Formation recherchee
    },
  });

  if (visitors.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text(
      ascii("Aucun visiteur ne correspond aux critères sélectionnés."),
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
  const logo = await loadLogo();

  drawHeader(doc, "Fiche visiteur", logo);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(ascii(`Date de génération : ${formatDateTime(new Date())}`), MARGIN, 45);

  autoTable(doc, {
    startY: 52,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    head: [[ascii("Informations du visiteur"), ""]],
    body: (
      [
      ["Prénom", formatFirstName(visitor.firstName)],
      ["Nom", formatLastName(visitor.lastName)],
      ["Pays d'origine", visitor.country],
      ["Téléphone", formatPhoneDisplay(visitor.phone)],
      ["Email", visitor.email ?? "-"],
      ["Établissement concerné", visitor.establishment ?? "-"],
      ["Formation recherchée", visitor.formationRequested],
      ["Consentement", visitor.consentGiven ? "Accordé" : "Non accordé"],
      ["Version du consentement", visitor.consentVersion ?? "-"],
      ["Date du consentement", formatDateTime(visitor.consentDate)],
      ["Date de création", formatDateTime(visitor.createdAt)],
      ["Identifiant", visitor.id],
      ] as Array<[string, string]>
    ).map(([cle, valeur]) => [ascii(cle), ascii(valeur)]),
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

/* -------------------------------------------------------------------------- */
/* Archives du service aux usagers : liste                                     */
/* -------------------------------------------------------------------------- */

/** Hauteur réservée au bandeau et au titre sur les pages suivantes. */
const CONTINUED_PAGE_TOP = 44;

export async function buildArchivePdf(
  entries: ArchiveEntry[],
  query: Pick<ResolvedArchiveQuery, "year" | "month" | "search">,
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLogo();
  const title = `Archives - Service aux usagers ${query.year}`;

  drawHeader(doc, title, logo);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);

  const meta = [
    `Période : ${describeArchiveScope(query.year, query.month)}`,
    `Date de génération : ${formatDateTime(new Date())}`,
    `Nombre de sollicitations : ${entries.length}`,
    `Usagers distincts (par adresse email) : ${new Set(entries.map((entry) => entry.email)).size}`,
  ];

  if (query.search) meta.push(`Recherche : « ${query.search} »`);

  meta.forEach((line, index) => doc.text(ascii(line), MARGIN, 45 + index * 5));

  autoTable(doc, {
    startY: 47 + meta.length * 5,
    margin: { left: MARGIN, right: MARGIN, top: CONTINUED_PAGE_TOP },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(doc, title, logo);
    },
    // « N° » perdrait son signe en ASCII : « No » reste lisible.
    head: [["Mois", "No", "Nom de l'usager", "Email", "Catégorie"].map(ascii)],
    body: entries.map((entry) =>
      [
        monthLabel(entry.month),
        entry.lineNumber,
        entry.fullName ?? "-",
        entry.email,
        senderCategory(entry.email),
      ].map(ascii),
    ),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 247, 249] },
    // A4 portrait : 210 mm moins 28 mm de marges = 182 mm.
    // Une adresse de 45 caracteres tient sur une ligne en 70 mm,
    // « Organisme senegalais » en 34 mm.
    columnStyles: {
      0: { cellWidth: 20 }, // Mois
      1: { cellWidth: 10 }, // No
      2: { cellWidth: 48 }, // Nom
      3: { cellWidth: 70 }, // Email
      4: { cellWidth: 34 }, // Categorie
    },
    didParseCell: alignRight([1]),
  });

  if (entries.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text(
      ascii("Aucune sollicitation ne correspond aux critères sélectionnés."),
      MARGIN,
      47 + meta.length * 5 + 14,
    );
  }

  drawFooter(doc);

  return Buffer.from(doc.output("arraybuffer"));
}

/* -------------------------------------------------------------------------- */
/* Archives du service aux usagers : statistiques                              */
/* -------------------------------------------------------------------------- */

const NUMBER = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** Part en pourcentage, arrondie à l'unité : « 42 % », « < 1 % ». */
function share(count: number, total: number) {
  if (total <= 0) return "-";
  const percent = Math.round((count / total) * 100);
  return count > 0 && percent === 0 ? "< 1 %" : `${percent} %`;
}

/**
 * Aligne à droite les colonnes chiffrées, en-tête et total compris :
 * `columnStyles` ne s'applique qu'au corps du tableau.
 */
function alignRight(columns: number[]) {
  return (data: CellHookData) => {
    if (columns.includes(data.column.index)) data.cell.styles.halign = "right";
  };
}

function lastTableBottom(doc: jsPDF) {
  return (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 50
  );
}

export async function buildArchiveStatsPdf(
  stats: ArchiveStats,
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLogo();
  const title = `Statistiques - Service aux usagers ${stats.year}`;
  const pageHeight = doc.internal.pageSize.getHeight();

  drawHeader(doc, title, logo);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);

  const coverage =
    stats.monthly.length > 0
      ? `de janvier à ${monthLabel(stats.monthly.length).toLowerCase()} ${stats.year}`
      : String(stats.year);

  [
    `Période couverte : ${coverage}`,
    `Date de génération : ${formatDateTime(new Date())}`,
    "Un usager est identifié par son adresse email.",
  ].forEach((line, index) => doc.text(ascii(line), MARGIN, 45 + index * 5));

  const tableDefaults = {
    margin: { left: MARGIN, right: MARGIN, top: CONTINUED_PAGE_TOP },
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) drawHeader(doc, title, logo);
    },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
    headStyles: {
      fillColor: BRAND,
      textColor: 255,
      fontStyle: "bold" as const,
    },
    alternateRowStyles: { fillColor: [246, 247, 249] as [number, number, number] },
  };

  /** Intitulé de section, avec saut de page s'il resterait orphelin. */
  const section = (label: string, after: number) => {
    let y = after + 10;
    if (y > pageHeight - 40) {
      doc.addPage();
      drawHeader(doc, title, logo);
      y = CONTINUED_PAGE_TOP + 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(ascii(label), MARGIN, y);
    return y + 3;
  };

  // 1. Indicateurs clés
  const personal =
    stats.categories.find((bucket) => bucket.label === "Particulier")?.count ??
    0;

  autoTable(doc, {
    ...tableDefaults,
    startY: section("Indicateurs clés", 57),
    theme: "grid",
    body: (
      [
        ["Sollicitations reçues", NUMBER.format(stats.total)],
        ["Usagers distincts", NUMBER.format(stats.distinctUsers)],
        [
          "Usagers ayant écrit plusieurs fois",
          `${NUMBER.format(stats.returningUsers)} (${share(stats.returningUsers, stats.distinctUsers)} des usagers)`,
        ],
        [
          "Moyenne mensuelle",
          `${NUMBER.format(stats.monthlyAverage)} sollicitations`,
        ],
        [
          "Mois le plus chargé",
          stats.busiestMonth
            ? `${monthLabel(stats.busiestMonth.month)} (${stats.busiestMonth.count})`
            : "-",
        ],
        [
          "Part des messageries personnelles",
          share(personal, stats.total),
        ],
      ] as Array<[string, string]>
    ).map((row) => row.map(ascii)),
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold", textColor: BRAND },
      1: { cellWidth: "auto" },
    },
  });

  // 2. Répartition mensuelle, avec une barre proportionnelle par mois
  const maxCount = Math.max(1, ...stats.monthly.map((month) => month.count));

  autoTable(doc, {
    ...tableDefaults,
    startY: section("Répartition mensuelle", lastTableBottom(doc)),
    head: [
      ["Mois", "Sollicitations", "Part", "Usagers distincts", "Volume"].map(
        ascii,
      ),
    ],
    body: stats.monthly.map((month) =>
      [
        monthLabel(month.month),
        String(month.count),
        share(month.count, stats.total),
        String(month.distinctUsers),
        "",
      ].map(ascii),
    ),
    foot: [
      [
        "Total",
        String(stats.total),
        "100 %",
        String(stats.distinctUsers),
        "",
      ],
    ],
    footStyles: { fillColor: [232, 237, 243], textColor: BRAND, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 28 },
      2: { cellWidth: 18 },
      3: { cellWidth: 32 },
      4: { cellWidth: "auto" },
    },
    didParseCell: alignRight([1, 2, 3]),
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 4) return;
      const count = stats.monthly[data.row.index]?.count ?? 0;
      if (count === 0) return;

      const width = Math.max(1, ((data.cell.width - 4) * count) / maxCount);
      doc.setFillColor(...GOLD);
      doc.roundedRect(
        data.cell.x + 2,
        data.cell.y + data.cell.height / 2 - 1.6,
        width,
        3.2,
        0.8,
        0.8,
        "F",
      );
    },
  });

  // 3. Catégories d'expéditeurs
  autoTable(doc, {
    ...tableDefaults,
    startY: section("Catégories d'expéditeurs", lastTableBottom(doc)),
    head: [["Catégorie", "Sollicitations", "Part"].map(ascii)],
    body: stats.categories.map((bucket) =>
      [bucket.label, String(bucket.count), share(bucket.count, stats.total)].map(
        ascii,
      ),
    ),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 32 },
      2: { cellWidth: 22 },
    },
    didParseCell: alignRight([1, 2]),
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    ascii(
      "Catégorie déduite du domaine de l'adresse : messagerie grand public (particulier), domaine .sn (organisme sénégalais), autre domaine.",
    ),
    MARGIN,
    lastTableBottom(doc) + 5,
    { maxWidth: doc.internal.pageSize.getWidth() - MARGIN * 2 },
  );

  // 4. Messageries et domaines : les huit premiers, le reste regroupé
  const topDomains = stats.domains.slice(0, 8);
  const otherDomains = stats.domains
    .slice(8)
    .reduce((sum, bucket) => sum + bucket.count, 0);

  autoTable(doc, {
    ...tableDefaults,
    startY: section("Messageries et domaines", lastTableBottom(doc) + 6),
    head: [["Domaine", "Sollicitations", "Part"].map(ascii)],
    body: [
      ...topDomains,
      ...(otherDomains > 0
        ? [
            {
              label: `Autres domaines (${stats.domains.length - topDomains.length})`,
              count: otherDomains,
            },
          ]
        : []),
    ].map((bucket) =>
      [bucket.label, String(bucket.count), share(bucket.count, stats.total)].map(
        ascii,
      ),
    ),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 32 },
      2: { cellWidth: 22 },
    },
    didParseCell: alignRight([1, 2]),
  });

  // 5. Usagers récurrents
  if (stats.topRequesters.length > 0) {
    autoTable(doc, {
      ...tableDefaults,
      startY: section("Usagers les plus récurrents", lastTableBottom(doc)),
      head: [["Usager", "Email", "Sollicitations", "Mois"].map(ascii)],
      body: stats.topRequesters.map((requester) =>
        [
          requester.label === requester.email ? "-" : requester.label,
          requester.email,
          String(requester.count),
          requester.months.map(monthLabel).join(", "),
        ].map(ascii),
      ),
      styles: { ...tableDefaults.styles, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 44 },
        1: { cellWidth: 60 },
        2: { cellWidth: 24 },
        3: { cellWidth: "auto" },
      },
      didParseCell: alignRight([2]),
    });
  }

  drawFooter(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
