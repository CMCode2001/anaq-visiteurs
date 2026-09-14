"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminIdentity } from "@/lib/auth/guards";
import { deleteVisitor } from "@/lib/services/visitors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      // Diagnostic : l'adresse réellement soumise (une faute de frappe ou un
      // remplissage automatique du navigateur donne le même `invalid_credentials`
      // qu'un mauvais mot de passe).
      emailSoumis: parsed.data.email,
      // Jamais le mot de passe, seulement sa longueur : suffit à repérer un
      // champ pré-rempli par le gestionnaire de mots de passe ou un
      // copier-coller tronqué.
      longueurMotDePasse: parsed.data.password.length,
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
