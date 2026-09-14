import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { canonicalCountryName, isKnownCountryName } from "@/lib/countries";

/**
 * Schéma unique partagé par le client (react-hook-form) et le serveur
 * (route API `POST /api/visitors`).
 *
 * Le serveur ne fait jamais confiance au client : il revalide intégralement
 * la charge utile reçue avec ce même schéma.
 */

/** Lettres (accents inclus), espaces, apostrophes et traits d'union. */
const NAME_PATTERN = /^[\p{L}][\p{L}\s'’.-]*$/u;


export const visitorFormSchema = z.object({
  firstName: z
    .string({ required_error: "Le prénom est obligatoire." })
    .trim()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères.")
    .regex(NAME_PATTERN, "Le prénom contient des caractères non autorisés."),

  lastName: z
    .string({ required_error: "Le nom est obligatoire." })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères.")
    .regex(NAME_PATTERN, "Le nom contient des caractères non autorisés."),

  // Le pays vient d'un référentiel fermé (ISO 3166-1) : on vérifie que le
  // libellé reçu en fait partie, pour garantir des statistiques et des
  // filtres homogènes. Voir src/lib/countries.ts.
  country: z
    .string({ required_error: "Le pays d'origine est obligatoire." })
    .trim()
    .min(1, "Veuillez sélectionner votre pays d'origine.")
    .max(100, "Le pays ne doit pas dépasser 100 caractères.")
    .refine(isKnownCountryName, "Veuillez sélectionner un pays dans la liste.")
    // Le libellé est ramené à sa forme officielle : « senegal » saisi à la
    // main est stocké « Sénégal ». Un seul libellé par pays en base.
    .transform(canonicalCountryName),

  // Validation réelle par libphonenumber-js : longueur ET préfixe opérateur
  // sont vérifiés pour le pays de l'indicatif. Un « +221 99 999 99 99 »
  // est rejeté alors qu'un simple contrôle de format l'accepterait.
  phone: z
    .string({ required_error: "Le téléphone est obligatoire." })
    .trim()
    .min(1, "Le téléphone est obligatoire.")
    .max(30, "Le numéro de téléphone est trop long.")
    .refine(
      (value) => isValidPhoneNumber(value),
      "Numéro de téléphone invalide. Vérifiez l'indicatif et le numéro.",
    ),

  email: z
    .string({ required_error: "L'adresse email est obligatoire." })
    .trim()
    .toLowerCase()
    .min(1, "L'adresse email est obligatoire.")
    .max(255, "L'adresse email ne doit pas dépasser 255 caractères.")
    .email("Adresse email invalide. Exemple : nom@exemple.com"),

  formationRequested: z
    .string({ required_error: "La formation recherchée est obligatoire." })
    .trim()
    .min(2, "Veuillez préciser la formation recherchée.")
    .max(500, "La formation ne doit pas dépasser 500 caractères."),

  consentGiven: z.boolean().refine((value) => value === true, {
    message:
      "Vous devez accepter la collecte de vos données pour valider le formulaire.",
  }),
});

export type VisitorFormValues = z.infer<typeof visitorFormSchema>;

/** Valeurs initiales du formulaire public. */
export const visitorFormDefaults: VisitorFormValues = {
  firstName: "",
  lastName: "",
  country: "",
  phone: "",
  email: "",
  formationRequested: "",
  consentGiven: false,
};
