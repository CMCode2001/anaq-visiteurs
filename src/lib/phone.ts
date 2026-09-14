import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Présentation des numéros de téléphone.
 *
 * Les numéros sont stockés au format E.164 (`+221771234567`) : compact,
 * non ambigu et indépendant des conventions locales. Ils ne sont mis en forme
 * qu'au moment de l'affichage — écran, Excel ou PDF.
 */

/** « +221771234567 » → « +221 77 123 45 67 ». */
export function formatPhoneDisplay(value: string | null | undefined) {
  if (!value) return "—";

  const parsed = parsePhoneNumberFromString(value);
  return parsed?.formatInternational() ?? value;
}

/** Valeur utilisable dans un lien `tel:` (jamais d'espaces). */
export function telHref(value: string | null | undefined) {
  if (!value) return undefined;

  const parsed = parsePhoneNumberFromString(value);
  return `tel:${parsed?.number ?? value.replace(/\s/g, "")}`;
}

/** Code ISO du pays de l'indicatif, pour afficher un drapeau si besoin. */
export function phoneCountryCode(value: string | null | undefined) {
  if (!value) return undefined;
  return parsePhoneNumberFromString(value)?.country;
}
