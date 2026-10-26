/**
 * Constantes applicatives ANAQ-Sup.
 * Un seul endroit à modifier pour les libellés institutionnels.
 */

export const ORG = {
  shortName: "ANAQ-Sup",
  /** Dénomination officielle complète (PDF, pied de page, mentions légales). */
  name: "Autorité nationale d'Assurance Qualité de l'Enseignement supérieur, de la Recherche et de l'Innovation",
  /** Version abrégée, affichée sur les petits écrans. */
  nameCompact: "Assurance Qualité de l'Enseignement supérieur",
  formTitle: "Fiche de présence des visiteurs",
  formSubtitle:
    "ANAQ-Sup - Informations sur les établissements habilités et les programmes accrédités",
  /** Remplacer par l'URL officielle de la politique de confidentialité. */
  privacyPolicyUrl: "/politique-confidentialite",
  /** Logo officiel, utilisé à l'écran et dans les exports PDF. */
  logoPath: "/logo-anaqsup.png",
  /**
   * Favicon fourni : toque universitaire blanche sur fond transparent.
   * Lisible sur une barre d'onglets sombre, invisible sur une barre claire.
   */
  faviconDark: "/favicon_anaq.png",
  /**
   * Même toque composée sur le marine institutionnel, pour les navigateurs
   * en thème clair. Régénérable avec `npm run favicon`.
   */
  faviconLight: "/favicon-anaq-clair.png",
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
  // Santé
  "Médecine",
  "Pharmacie",
  "Odontologie",
  "Sciences infirmières",
  "Sage-femme / Maïeutique",
  "Biologie médicale",
  "Santé publique",
  "Médecine vétérinaire",
  // Droit, économie, gestion
  "Droit",
  "Sciences économiques et gestion",
  "Comptabilité et finance",
  "Audit et contrôle de gestion",
  "Fiscalité",
  "Commerce international",
  "Transit et douane",
  "Banque et assurance",
  "Marketing et communication",
  "Management des ressources humaines",
  "Gestion de projet",
  "Entrepreneuriat",
  "Secrétariat et assistanat de direction",
  // Numérique
  "Informatique / Génie logiciel",
  "Réseaux et télécommunications",
  "Intelligence artificielle et données",
  "Cybersécurité",
  "Multimédia et design graphique",
  // Ingénierie et énergie
  "Génie civil",
  "Génie électrique",
  "Génie mécanique",
  "Génie chimique",
  "Génie industriel et maintenance",
  "Mines et géologie",
  "Pétrole et Gaz",
  "Énergie renouvelable",
  "Aéronautique",
  "Architecture et urbanisme",
  // Sciences fondamentales
  "Mathématiques et statistiques",
  "Physique et chimie",
  "Biologie et sciences de la vie",
  // Agriculture et environnement
  "Agronomie et agroalimentaire",
  "Élevage et productions animales",
  "Pêche et aquaculture",
  "Environnement et développement durable",
  "Qualité, hygiène, sécurité, environnement (QHSE)",
  // Lettres, sciences humaines et sociales
  "Sciences de l'éducation",
  "Lettres et sciences humaines",
  "Langues étrangères appliquées",
  "Études arabes et islamiques",
  "Histoire et géographie",
  "Philosophie",
  "Sociologie",
  "Psychologie",
  "Travail social",
  "Journalisme",
  "Arts et culture",
  // Services et autres
  "Tourisme et hôtellerie",
  "Transport et logistique",
  "Sciences politiques et relations internationales",
  "Sport (STAPS)",
  "Autre",
] as const;
