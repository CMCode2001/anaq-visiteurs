import { z } from "zod";

/**
 * Saisie et correction des sollicitations archivées.
 * Schémas partagés par les formulaires et les Server Actions, qui
 * revalident tout.
 *
 * Les noms sont facultatifs : un organisme qui écrit (bureau des
 * admissions, organisme d'évaluation) n'a pas de prénom, et le registre
 * historique compte déjà des lignes réduites à une adresse.
 */

const optionalName = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `Le ${label} ne doit pas dépasser ${max} caractères.`)
    .refine(
      (value) => value === "" || value.length >= 2,
      `Le ${label} doit contenir au moins 2 caractères.`,
    );

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "L'adresse email est obligatoire.")
  .max(255, "L'adresse email ne doit pas dépasser 255 caractères.")
  .email("Adresse email invalide. Exemple : nom@exemple.com");

/** Ajout : prénom et nom séparés, composés ensuite à la convention. */
export const archiveEntrySchema = z.object({
  firstName: optionalName("prénom", 100),
  lastName: optionalName("nom", 100),
  email,
});

/**
 * Correction : un nom complet, tel qu'enregistré. Prénom et nom ne sont
 * pas séparables dans les lignes importées du registre.
 */
export const archiveEntryUpdateSchema = z.object({
  fullName: optionalName("nom", 200),
  email,
});

/** L'adresse seule, pour détecter la catégorie pendant la saisie. */
export const archiveEmailSchema = email;

export type ArchiveEntryFormValues = z.input<typeof archiveEntrySchema>;
export type ArchiveEntryUpdateValues = z.input<typeof archiveEntryUpdateSchema>;

export type FieldErrors<Values> = Partial<Record<keyof Values, string>>;

/** Premier message d'erreur de chaque champ, pour l'affichage. */
export function fieldErrorsOf<Values>(
  error: z.ZodError<Values>,
): FieldErrors<Values> {
  const errors: FieldErrors<Values> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof Values;
    errors[field] ??= issue.message;
  }
  return errors;
}
