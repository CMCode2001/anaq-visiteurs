import { Archive } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Affiché tant qu'aucun registre n'a été importé : la table est créée par
 * la migration 0005, les données par le script généré depuis le registre.
 */
export function ArchiveEmptyNotice() {
  return (
    <Card>
      <CardContent className="p-6">
        <EmptyState
          icon={<Archive className="size-5" />}
          title="Aucune archive importée pour le moment"
          description="Exécutez la migration supabase/migrations/0005_archive_entries.sql dans Supabase, puis le script d’import produit à partir du registre Word par scripts/archive-docx-to-sql.mjs."
        />
      </CardContent>
    </Card>
  );
}
