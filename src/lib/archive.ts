import type {
  ArchiveEntry,
  ArchiveRequester,
  ArchiveStats,
  MonthlyArchiveCount,
} from "@/types/archive";
import { FORMATION_SUGGESTIONS } from "@/lib/constants";
import { formatFirstName, formatLastName } from "@/lib/utils";
import type { CountBucket } from "@/types/visitor";

/**
 * Référentiels et calculs des archives du service aux usagers.
 * Module pur, partagé par l'écran, les exports et les statistiques.
 */

export const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

const MONTH_SHORT_LABELS = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
] as const;

export function monthLabel(month: number) {
  return MONTH_LABELS[month - 1] ?? String(month);
}

export function monthShortLabel(month: number) {
  return MONTH_SHORT_LABELS[month - 1] ?? String(month);
}

/** « Octobre 2026 », ou « Année 2026, tous les mois » (en-tête des exports). */
export function describeArchiveScope(year: number, month?: number) {
  return month ? `${monthLabel(month)} ${year}` : `Année ${year}, tous les mois`;
}

/**
 * Nom complet d'une sollicitation ajoutée depuis l'application.
 *
 * Le registre ne connaît qu'un nom complet : il est composé à la convention
 * des registres administratifs (« Awa DIALLO »). Sans prénom, c'est le plus
 * souvent un organisme (« Service de la scolarité ») : sa graphie est
 * conservée telle que saisie. `null` si rien n'est renseigné.
 */
export function composeArchiveName(firstName: string, lastName: string) {
  const first = firstName.trim();
  const last = lastName.trim();

  if (!first) return last || null;
  return last
    ? `${formatFirstName(first)} ${formatLastName(last)}`
    : formatFirstName(first);
}

/* -------------------------------------------------------------------------- */
/* Spécialité demandée                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Suggestions du champ « Spécialité » : la liste des formations du
 * formulaire visiteur, pour que les deux espaces parlent le même langage.
 */
export const SPECIALTY_SUGGESTIONS = FORMATION_SUGGESTIONS;

function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SUGGESTION_BY_FOLD = new Map<string, string>(
  SPECIALTY_SUGGESTIONS.map((label) => [foldText(label), label]),
);

/**
 * Forme enregistrée d'une spécialité, pour des statistiques qui ne se
 * fragmentent pas : « informatique / genie logiciel » saisi à la main
 * devient le libellé de la liste, « Informatique / Génie logiciel ».
 * Hors liste, la saisie est gardée, première lettre en capitale.
 * `null` si rien n'est renseigné.
 */
export function canonicalSpecialty(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) return null;

  return (
    SUGGESTION_BY_FOLD.get(foldText(text)) ??
    text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1)
  );
}

/* -------------------------------------------------------------------------- */
/* Catégorie d'expéditeur                                                      */
/* -------------------------------------------------------------------------- */

export const SENDER_CATEGORIES = [
  "Particulier",
  "Organisme sénégalais",
  "Autre organisme",
] as const;

export type SenderCategory = (typeof SENDER_CATEGORIES)[number];

/**
 * Messageries grand public : une adresse chez l'un de ces fournisseurs est
 * celle d'une personne, pas d'une institution.
 */
const PERSONAL_DOMAIN =
  /^(gmail|googlemail|icloud|me|mac|yahoo|ymail|hotmail|outlook|live|msn|aol|gmx|protonmail|proton|laposte|orange|free|sfr|wanadoo)\.[a-z.]+$/;

export function emailDomain(email: string) {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

/**
 * Déduite du domaine de l'adresse, seule information fiable du registre.
 *
 * Un domaine en `.sn` qui n'est pas une messagerie est celui d'un
 * établissement ou d'une entreprise sénégalaise (ucad.edu.sn, esp.sn...).
 * Tout le reste est rangé en « autre organisme » plutôt qu'en « étranger » :
 * un `.com` ne dit rien du pays de son titulaire.
 */
export function senderCategory(email: string): SenderCategory {
  const domain = emailDomain(email);
  if (PERSONAL_DOMAIN.test(domain)) return "Particulier";
  if (domain.endsWith(".sn")) return "Organisme sénégalais";
  return "Autre organisme";
}

/* -------------------------------------------------------------------------- */
/* Statistiques                                                                */
/* -------------------------------------------------------------------------- */

export function computeArchiveStats(
  entries: ArchiveEntry[],
  year: number,
): ArchiveStats {
  const lastMonth = entries.reduce((max, entry) => Math.max(max, entry.month), 0);

  const monthly: MonthlyArchiveCount[] = Array.from(
    { length: lastMonth },
    (_, index) => {
      const month = index + 1;
      const ofMonth = entries.filter((entry) => entry.month === month);
      return {
        month,
        count: ofMonth.length,
        distinctUsers: new Set(ofMonth.map((entry) => entry.email)).size,
      };
    },
  );

  const byEmail = new Map<string, ArchiveEntry[]>();
  for (const entry of entries) {
    const list = byEmail.get(entry.email) ?? [];
    list.push(entry);
    byEmail.set(entry.email, list);
  }

  const requesters: ArchiveRequester[] = [...byEmail].map(([email, list]) => {
    const named = list.filter((entry) => entry.fullName);
    return {
      label: named.at(-1)?.fullName ?? email,
      email,
      count: list.length,
      months: [...new Set(list.map((entry) => entry.month))].sort((a, b) => a - b),
    };
  });

  const specialties = entries
    .map((entry) => entry.specialty)
    .filter((specialty): specialty is string => Boolean(specialty));

  const busiestMonth = monthly.reduce<MonthlyArchiveCount | null>(
    (best, current) => (!best || current.count > best.count ? current : best),
    null,
  );

  return {
    year,
    total: entries.length,
    distinctUsers: byEmail.size,
    returningUsers: requesters.filter((requester) => requester.count > 1).length,
    monthlyAverage: lastMonth > 0 ? entries.length / lastMonth : 0,
    busiestMonth: busiestMonth && busiestMonth.count > 0 ? busiestMonth : null,
    monthly,
    categories: countBy(entries.map((entry) => senderCategory(entry.email))),
    domains: countBy(entries.map((entry) => emailDomain(entry.email))),
    specialties: countBy(specialties),
    specialtyCount: specialties.length,
    topRequesters: requesters
      .filter((requester) => requester.count > 1)
      .sort(
        (a, b) =>
          b.count - a.count || a.label.localeCompare(b.label, "fr"),
      )
      .slice(0, 10),
  };
}

function countBy(values: string[]): CountBucket[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}
