"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { monthLabel } from "@/lib/archive";
import { getAdminIdentity } from "@/lib/auth/guards";
import {
  addArchiveEntry,
  deleteArchiveEntry,
  updateArchiveEntry,
} from "@/lib/services/archives";
import { deleteVisitor } from "@/lib/services/visitors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  archiveEntrySchema,
  archiveEntryUpdateSchema,
  fieldErrorsOf,
  type ArchiveEntryFormValues,
  type ArchiveEntryUpdateValues,
  type FieldErrors,
} from "@/lib/validation/archive-entry";

/**
 * Server Actions de l'espace administrateur.
 * Chaque action revérifie l'autorisation : on ne se fie jamais au fait que
 * l'appel provienne d'une page déjà protégée.
 */

export interface ActionState {
  error?: string;
  success?: string;
}

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "L'adresse email est obligatoire.")
    .email("Adresse email invalide."),
  password: z
    .string()
    .min(1, "Le mot de passe est obligatoire.")
    .max(200, "Mot de passe trop long."),
  redirectTo: z.string().optional(),
});

/** Chemin de redirection interne uniquement (protection open redirect). */
function safeRedirect(value: string | undefined) {
  if (!value) return "/admin/dashboard";
  if (!value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin/dashboard";
  }
  return value;
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Identifiants invalides." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // L'utilisateur ne voit qu'un message générique : révéler « email inconnu »
    // ou « email non confirmé » indiquerait à un attaquant quels comptes
    // existent. La cause réelle part en revanche dans les journaux serveur
    // (Vercel > Logs), sans quoi une erreur de configuration serait
    // indiagnosticable.
    console.error("[admin/login] échec d'authentification", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    return { error: "Email ou mot de passe incorrect." };
  }

  // La session existe, mais l'utilisateur doit aussi figurer dans admin_users.
  const identity = await getAdminIdentity();

  if (!identity) {
    await supabase.auth.signOut();
    return {
      error:
        "Ce compte n'est pas autorisé à accéder à l'espace d'administration.",
    };
  }

  redirect(safeRedirect(parsed.data.redirectTo));
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

const deleteSchema = z.object({
  id: z.string().uuid("Identifiant de visiteur invalide."),
});

export async function deleteVisitorAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await getAdminIdentity();
  if (!identity) {
    return { error: "Accès refusé." };
  }

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  }

  try {
    await deleteVisitor(parsed.data.id);
  } catch (error) {
    console.error("[admin] suppression impossible", error);
    return { error: "La suppression de la fiche a échoué." };
  }

  revalidatePath("/admin/visitors");
  revalidatePath("/admin/dashboard");

  return { success: "La fiche du visiteur a été supprimée." };
}

export interface ArchiveFormState<Values> {
  error?: string;
  success?: string;
  fieldErrors?: FieldErrors<Values>;
}

/** Ajout d'une sollicitation aux archives du service aux usagers. */
export async function addArchiveEntryAction(
  input: unknown,
): Promise<ArchiveFormState<ArchiveEntryFormValues>> {
  const identity = await getAdminIdentity();
  if (!identity) {
    return { error: "Accès refusé." };
  }

  const parsed = archiveEntrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Vérifiez les champs signalés.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  try {
    const position = await addArchiveEntry(parsed.data);

    revalidatePath("/admin/archives");
    revalidatePath("/admin/archives/statistiques");

    return {
      success: `${monthLabel(position.month)} ${position.year}, n° ${position.lineNumber}.`,
    };
  } catch (error) {
    console.error("[admin] ajout aux archives impossible", error);
    return {
      error: archiveWriteError(error, "0006", "L'ajout de la sollicitation a échoué."),
    };
  }
}

const archiveIdSchema = z.object({
  id: z.string().uuid("Identifiant de sollicitation invalide."),
});

/** Correction du nom, de l'adresse et de la spécialité d'une sollicitation. */
export async function updateArchiveEntryAction(
  id: unknown,
  input: unknown,
): Promise<ArchiveFormState<ArchiveEntryUpdateValues>> {
  const identity = await getAdminIdentity();
  if (!identity) {
    return { error: "Accès refusé." };
  }

  const target = archiveIdSchema.safeParse({ id });
  if (!target.success) {
    return { error: target.error.issues[0]?.message ?? "Requête invalide." };
  }

  const parsed = archiveEntryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Vérifiez les champs signalés.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  try {
    const updated = await updateArchiveEntry(target.data.id, parsed.data);
    if (!updated) {
      return { error: "Cette sollicitation n'existe plus." };
    }
  } catch (error) {
    console.error("[admin] modification dans les archives impossible", error);
    return {
      error: archiveWriteError(
        error,
        "0007",
        "La modification de la sollicitation a échoué.",
      ),
    };
  }

  revalidatePath("/admin/archives");
  revalidatePath("/admin/archives/statistiques");

  return { success: "La sollicitation a été modifiée." };
}

/** Suppression définitive d'une sollicitation archivée. */
export async function deleteArchiveEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await getAdminIdentity();
  if (!identity) {
    return { error: "Accès refusé." };
  }

  const parsed = archiveIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  }

  try {
    const removed = await deleteArchiveEntry(parsed.data.id);
    if (!removed) {
      return { error: "Cette sollicitation n'existe plus." };
    }
  } catch (error) {
    console.error("[admin] suppression dans les archives impossible", error);
    return {
      error: archiveWriteError(
        error,
        "0007",
        "La suppression de la sollicitation a échoué.",
      ),
    };
  }

  revalidatePath("/admin/archives");
  revalidatePath("/admin/archives/statistiques");

  return { success: "La sollicitation a été supprimée des archives." };
}

/**
 * Message lisible pour un refus de la base sur `archive_entries`.
 *
 * Les deux refus partagent le code 42501 mais n'ont pas la même cause :
 * « permission denied » signifie que la migration qui ouvre l'écriture n'a
 * pas été exécutée, « row-level security » que le compte n'est pas
 * administrateur actif.
 */
function archiveWriteError(
  error: unknown,
  migration: string,
  fallback: string,
) {
  const cause = (error as { cause?: { code?: string; message?: string } })
    .cause;
  if (cause?.code !== "42501") return fallback;

  return cause.message?.includes("row-level security")
    ? "Votre compte n'est pas autorisé à modifier les archives."
    : `La base refuse l'opération : exécutez la migration ${migration} dans Supabase.`;
}
