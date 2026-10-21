import { z } from "zod";

/**
 * Ajout d'une sollicitation aux archives du service aux usagers.
 * Schéma partagé par le formulaire et la Server Action, qui revalide tout.
 *
 * Prénom et nom sont facultatifs : un organisme qui écrit (bureau des
 * admissions, organisme d'évaluation) n'a pas de prénom, et le registre
 * historique compte déjà des lignes réduites à une adresse.
 */

const optionalName = (label: string) =>
  z
    .string()
    .trim()
    .max(100, `Le ${label} ne doit pas dépasser 100 caractères.`)
    .refine(
      (value) => value === "" || value.length >= 2,
      `Le ${label} doit contenir au moins 2 caractères.`,
    );

export const archiveEntrySchema = z.object({
  firstName: optionalName("prénom"),
  lastName: optionalName("nom"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "L'adresse email est obligatoire.")
    .max(255, "L'adresse email ne doit pas dépasser 255 caractères.")
    .email("Adresse email invalide. Exemple : nom@exemple.com"),
});

export type ArchiveEntryFormValues = z.input<typeof archiveEntrySchema>;
export type ArchiveEntryFieldErrors = Partial<
  Record<keyof ArchiveEntryFormValues, string>
>;

/** Premier message d'erreur de chaque champ, pour l'affichage. */
export function archiveEntryFieldErrors(
  error: z.ZodError<ArchiveEntryFormValues>,
): ArchiveEntryFieldErrors {
  const errors: ArchiveEntryFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof ArchiveEntryFormValues;
    errors[field] ??= issue.message;
  }
  return errors;
}
