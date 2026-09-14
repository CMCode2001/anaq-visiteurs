/**
 * Constantes applicatives ANAQ-Sup.
 * Un seul endroit à modifier pour les libellés institutionnels.
 */

export const ORG = {
  shortName: "ANAQ-Sup",
  name: "Autorité Nationale d'Assurance Qualité de l'Enseignement Supérieur",
  formTitle: "Fiche de présence des visiteurs",
  formSubtitle:
    "ANAQ-Sup - Informations sur les établissements habilités et les programmes accrédités",
  /** Remplacer par l'URL officielle de la politique de confidentialité. */
  privacyPolicyUrl: "/politique-confidentialite",
  /** Logo officiel, utilisé à l'écran, en favicon et dans les exports PDF. */
  logoPath: "/logo-anaqsup.png",
  /** Dimensions natives du logo, pour préserver ses proportions. */
  logoWidth: 801,
  logoHeight: 304,
} as const;

/** Rapport largeur / hauteur du logo officiel. */
export const LOGO_RATIO = ORG.logoWidth / ORG.logoHeight;

/**
 * Version du texte de consentement. À incrémenter à chaque modification
 * de la formulation : la version est historisée avec chaque visiteur.
 */
export const CONSENT_VERSION =
  process.env.NEXT_PUBLIC_CONSENT_VERSION?.trim() || "1.0";

export const CONSENT_TEXT =
  "J'accepte que mes données personnelles soient collectées et utilisées par l'ANAQ-Sup dans le cadre du traitement de ma demande d'information.";

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/** Plafond de lignes exportables en une fois (protection mémoire / coût). */
export const EXPORT_MAX_ROWS = 10_000;

/**
 * Suggestions de formations proposées dans le champ « Formation recherchée ».
 * La saisie libre reste possible : cette liste n'est qu'un raccourci.
 *
 * La liste des pays, elle, vient du référentiel ISO 3166-1 -
 * voir `src/lib/countries.ts`.
 */
export const FORMATION_SUGGESTIONS = [
  "Médecine",
  "Pharmacie",
  "Odontologie",
  "Sciences infirmières",
  "Droit",
  "Sciences économiques et gestion",
  "Comptabilité et finance",
  "Banque et assurance",
  "Marketing et communication",
  "Management des ressources humaines",
  "Informatique / Génie logiciel",
  "Réseaux et télécommunications",
  "Intelligence artificielle et données",
  "Génie civil",
  "Génie électrique",
  "Génie mécanique",
  "Architecture et urbanisme",
  "Agronomie et agroalimentaire",
  "Environnement et développement durable",
  "Sciences de l'éducation",
  "Lettres et sciences humaines",
  "Langues étrangères appliquées",
  "Journalisme",
  "Tourisme et hôtellerie",
  "Transport et logistique",
  "Sciences politiques et relations internationales",
  "Autre",
] as const;
