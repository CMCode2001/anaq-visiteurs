import { getCountries } from "libphonenumber-js";
import frLabels from "react-phone-number-input/locale/fr.json";

/**
 * Référentiel des pays, en français.
 *
 * La source est `libphonenumber-js` (codes ISO 3166-1 alpha-2) et les libellés
 * proviennent de la locale française de `react-phone-number-input` : un seul
 * référentiel alimente donc le sélecteur de pays, l'indicatif téléphonique et
 * les drapeaux. Aucune liste maintenue à la main, aucune divergence possible.
 *
 * Ce module ne dépend d'aucun composant React : il est importable côté client
 * comme côté serveur (schéma Zod, exports).
 */

export interface Country {
  /** Code ISO 3166-1 alpha-2, ex. « SN ». */
  code: string;
  /** Libellé français, ex. « Sénégal » - c'est la valeur stockée en base. */
  name: string;
}

/** Clés techniques présentes dans le fichier de locale, à ignorer. */
const NON_COUNTRY_KEYS = new Set(["ext", "country", "phone", "ZZ"]);

const labels = frLabels as Record<string, string>;

const collator = new Intl.Collator("fr", { sensitivity: "base" });

/** Tous les pays, triés alphabétiquement selon les règles françaises. */
export const COUNTRIES: Country[] = getCountries()
  .filter((code) => !NON_COUNTRY_KEYS.has(code) && labels[code])
  .map((code) => ({ code, name: labels[code] as string }))
  .sort((a, b) => collator.compare(a.name, b.name));

/**
 * Pays proposés en tête de liste : le Sénégal et ses voisins immédiats,
 * qui représentent l'essentiel des visiteurs de l'ANAQ-Sup.
 */
export const PRIORITY_COUNTRY_CODES = [
  "SN",
  "ML",
  "GN",
  "GW",
  "MR",
  "GM",
  "CI",
  "BF",
  "NE",
  "CV",
] as const;

export const PRIORITY_COUNTRIES: Country[] = PRIORITY_COUNTRY_CODES.map(
  (code) => COUNTRIES.find((country) => country.code === code),
).filter((country): country is Country => Boolean(country));

/**
 * Tous les pays *sauf* ceux déjà épinglés en tête : évite qu'un pays
 * apparaisse deux fois dans le sélecteur.
 */
export const OTHER_COUNTRIES: Country[] = COUNTRIES.filter(
  (country) =>
    !PRIORITY_COUNTRY_CODES.includes(
      country.code as (typeof PRIORITY_COUNTRY_CODES)[number],
    ),
);

const byName = new Map(
  COUNTRIES.map((country) => [normalize(country.name), country]),
);

/**
 * Index secondaire, séparateurs supprimés : « cote divoire » retrouve
 * « Côte d'Ivoire ». La recherche du sélecteur et la validation du schéma
 * acceptent ainsi exactement les mêmes saisies.
 */
const byNameSquashed = new Map(
  COUNTRIES.map((country) => [
    normalize(country.name).replaceAll(" ", ""),
    country,
  ]),
);

/** Recherche un pays par son libellé, en tolérant accents et séparateurs. */
function lookupByName(name: string | undefined | null) {
  if (!name) return undefined;
  const normalized = normalize(name);
  return (
    byName.get(normalized) ?? byNameSquashed.get(normalized.replaceAll(" ", ""))
  );
}

const byCode = new Map(COUNTRIES.map((country) => [country.code, country]));

/** Indicatif par défaut du sélecteur téléphonique. */
export const DEFAULT_COUNTRY = "SN";

/** Libellé français d'un code ISO, ou le code lui-même s'il est inconnu. */
export function countryName(code: string | undefined | null): string {
  if (!code) return "";
  return byCode.get(code)?.name ?? code;
}

/** Retrouve le code ISO à partir du libellé stocké en base. */
export function countryCodeFromName(name: string | undefined | null) {
  return lookupByName(name)?.code;
}

/**
 * Ramène un libellé au nom officiel du référentiel.
 * « senegal », « SÉNÉGAL » ou « Senegal » deviennent tous « Sénégal », ce qui
 * garantit un seul et même libellé dans les filtres, les statistiques et les
 * exports. Un libellé inconnu est renvoyé tel quel (il est de toute façon
 * rejeté en amont par la validation).
 */
export function canonicalCountryName(name: string) {
  return lookupByName(name)?.name ?? name;
}

/** Le libellé correspond-il à un pays connu du référentiel ? */
export function isKnownCountryName(name: string) {
  return lookupByName(name) !== undefined;
}

/** URL du drapeau, servi depuis `public/flags/` (voir scripts/copy-flags.mjs). */
export function flagUrl(code: string) {
  return `/flags/${code.toUpperCase()}.svg`;
}

/**
 * Normalise pour la recherche et les correspondances : minuscules, sans
 * accents, sans ponctuation. « Côte d'Ivoire » et « cote divoire » se
 * rejoignent donc, ce qui évite à l'agent d'accueil de chercher le bon accent.
 */
export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
