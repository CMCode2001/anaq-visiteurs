import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind sans conflit (convention shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeZone: "UTC",
});

const DATE_LONG_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

/**
 * Les dates sont formatées en UTC côté serveur ET côté client : cela évite
 * les erreurs d'hydratation React et garantit un export identique partout.
 * (Le Sénégal est à UTC+0, l'affichage correspond donc à l'heure locale.)
 */
export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_TIME_FORMATTER.format(date);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTER.format(date);
}

export function formatDateLong(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_LONG_FORMATTER.format(date);
}

/** "YYYY-MM-DD" en UTC, utilisé pour les noms de fichiers et les filtres. */
export function toIsoDay(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Initiales d'un visiteur, pour les avatars de la fiche détaillée. */
export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Tronque proprement une chaîne pour l'affichage en tableau. */
export function truncate(value: string, max = 60) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
