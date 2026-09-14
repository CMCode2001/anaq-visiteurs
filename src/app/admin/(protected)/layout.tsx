import { AdminShell } from "@/components/admin/admin-shell";
import { SetupNotice } from "@/components/setup-notice";
import { requireAdmin } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Layout des pages protégées de l'espace administrateur.
 * `requireAdmin()` s'exécute côté serveur avant tout rendu : une session
 * valide mais non habilitée est renvoyée vers la page de connexion.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const identity = await requireAdmin();

  return <AdminShell identity={identity}>{children}</AdminShell>;
}
