/**
 * Convertit un registre Word « Service aux usagers » en script SQL
 * d'insertion dans `public.archive_entries`.
 *
 *   node scripts/archive-docx-to-sql.mjs registre.docx [annee] > archive.sql
 *
 * Le fichier produit contient des donnees personnelles (noms, adresses
 * email). Le depot etant public, il ne doit JAMAIS etre versionne : le
 * dossier `supabase/private/` est ignore par Git a cet effet. On l'execute
 * une fois dans Supabase > SQL Editor, apres la migration 0005.
 *
 * Format attendu du document, tel que tenu par le service :
 *   - un titre contenant l'annee (« SERVICE AUX USAGERS 2026 ») ;
 *   - une liste numerotee par mois, chaque ligne « Nom <email> » ;
 *   - un intitule de mois avant chaque liste (« FEVIRIER », « Mars »...),
 *     sauf pour la premiere, qui suit directement le titre : janvier.
 *
 * Le document est saisi a la main par copier-coller depuis la messagerie.
 * Le nettoyage absorbe ce que cela produit : prefixes « De : », chevrons
 * manquants, liens « mailto: », casse aleatoire, caracteres mal decodes.
 * Chaque ligne non vide compte pour une sollicitation, doublons compris :
 * un usager qui ecrit deux fois a bien sollicite le service deux fois.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import XLSX from "xlsx";

const MONTH_PREFIXES = [
  "janv",
  "fev",
  "mars",
  "avr",
  "mai",
  "juin",
  "juil",
  "aou",
  "sept",
  "oct",
  "nov",
  "dec",
];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Corrections de saisie qu'aucune regle generale ne peut deviner. */
const NAME_FIXES = new Map([["kon?", "koné"]]);

const [, , input, yearArg] = process.argv;

if (!input) {
  console.error(
    "Usage : node scripts/archive-docx-to-sql.mjs registre.docx [annee] > archive.sql",
  );
  process.exit(1);
}

const paragraphs = await readParagraphs(input);
const year = Number(yearArg) || detectYear(paragraphs);

if (!year) {
  console.error("Annee introuvable dans le titre : la passer en argument.");
  process.exit(1);
}

const entries = [];
let month = 1;
let lineNumber = 0;

for (const text of paragraphs) {
  const emails = text.match(EMAIL);

  if (!emails) {
    const detected = detectMonth(text);
    if (detected && detected !== month) {
      month = detected;
      lineNumber = 0;
    }
    continue;
  }

  lineNumber += 1;
  entries.push({
    month,
    lineNumber,
    fullName: cleanName(text, emails),
    email: emails[0].toLowerCase(),
  });
}

if (entries.length === 0) {
  console.error("Aucune ligne « Nom <email> » reconnue dans ce document.");
  process.exit(1);
}

process.stdout.write(toSql(entries, year, path.basename(input)));

const perMonth = new Map();
for (const entry of entries) {
  perMonth.set(entry.month, (perMonth.get(entry.month) ?? 0) + 1);
}
console.error(
  `[archive] ${entries.length} sollicitations ${year} : ` +
    [...perMonth].map(([m, count]) => `${m}=${count}`).join(", "),
);

/* -------------------------------------------------------------------------- */

/** Texte de chaque paragraphe de `word/document.xml`. */
async function readParagraphs(file) {
  // Un .docx est une archive zip : SheetJS, deja present pour l'export
  // Excel, sait la lire sans dependance supplementaire.
  const container = XLSX.CFB.read(await readFile(file), { type: "buffer" });
  const entry = XLSX.CFB.find(container, "/word/document.xml");
  if (!entry) throw new Error(`${file} n'est pas un document Word (.docx).`);

  const xml = Buffer.from(entry.content).toString("utf8");

  return [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(([paragraph]) =>
    decodeXml(
      paragraph
        .replace(/<w:(?:br|tab)\b[^>]*\/>/g, " ")
        .match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)
        ?.map((run) => run.replace(/<[^>]+>/g, ""))
        .join("") ?? "",
    ).trim(),
  );
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function fold(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .trim();
}

function detectYear(texts) {
  for (const text of texts) {
    const match = text.match(/\b(20\d{2})\b/);
    if (match && !text.match(EMAIL)) return Number(match[1]);
  }
  return null;
}

/** « FEVIRIER », « Juin », « AOUT » : on tolere les fautes de frappe. */
function detectMonth(text) {
  const word = fold(text);
  if (!word || word.includes(" ")) return null;

  const index = MONTH_PREFIXES.findIndex((prefix) => word.startsWith(prefix));
  return index === -1 ? null : index + 1;
}

function cleanName(text, emails) {
  let name = text;
  for (const email of emails) name = name.split(email).join(" ");

  name = repairMojibake(name)
    .replace(/mailto:/gi, " ")
    .replace(/^\s*(?:de|email)\s*:/i, " ")
    .replace(/[<>*\[\]":]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [wrong, right] of NAME_FIXES) {
    name = name.split(wrong).join(right);
  }

  if (name.length < 2) return null;

  // Tout en minuscules ou tout en capitales : on remet une casse de titre.
  // Une casse mixte (« Awa DIALLO ») est une intention, on la garde.
  if (name === name.toLowerCase() || name === name.toUpperCase()) {
    name = name
      .toLocaleLowerCase("fr-FR")
      .replace(/(^|[\s'’-])(\p{L})/gu, (_, separator, letter) =>
        separator + letter.toLocaleUpperCase("fr-FR"),
      );
  }

  return name;
}

/** « HÃ©lÃ¨ne » pour « Hélène » : UTF-8 relu comme du Latin-1 au copier-coller. */
function repairMojibake(value) {
  if (!/[ÃÂ][\u0080-¿]/.test(value)) return value;
  const repaired = Buffer.from(value, "latin1").toString("utf8");
  return repaired.includes("�") ? value : repaired;
}

function sqlText(value) {
  return value === null ? "null" : `'${value.replace(/'/g, "''")}'`;
}

function toSql(rows, year, source) {
  const values = rows
    .map(
      (row) =>
        `  (${year}, ${row.month}, ${row.lineNumber}, ${sqlText(row.fullName)}, ${sqlText(row.email)})`,
    )
    .join(",\n");

  return `-- =============================================================================
-- ANAQ-Sup -- Archives du service aux usagers ${year}
-- =============================================================================
-- Genere par scripts/archive-docx-to-sql.mjs depuis « ${source} ».
--
-- CONTIENT DES DONNEES PERSONNELLES : ne jamais versionner ce fichier.
--
-- A executer dans Supabase > SQL Editor, apres la migration 0005.
-- Re-executable : une ligne deja importee (meme annee, mois et numero) est
-- ignoree, jamais dupliquee.
-- =============================================================================

insert into public.archive_entries (year, month, line_number, full_name, email)
values
${values}
on conflict (year, month, line_number) do nothing;

-- Verification : nombre de sollicitations par mois
select month, count(*) as sollicitations
from public.archive_entries
where year = ${year}
group by month
order by month;
`;
}
