import { redirect } from "next/navigation";

/** /admin redirige vers le tableau de bord (ou la connexion via le middleware). */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
