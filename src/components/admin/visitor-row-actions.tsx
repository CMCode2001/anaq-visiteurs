"use client";

import { FileDown, Trash2 } from "lucide-react";

import { DeleteVisitorDialog } from "@/components/admin/delete-visitor-dialog";
import { Button } from "@/components/ui/button";

/**
 * Actions d’une ligne du tableau.
 *
 * Il n’y a plus de bouton « ouvrir » : la ligne entière est cliquable. Ne
 * restent que les deux actions qui ne sont pas la navigation — télécharger la
 * fiche PDF et supprimer.
 */
export function VisitorRowActions({
  visitorId,
  visitorName,
}: {
  visitorId: string;
  visitorName: string;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        asChild
        variant="ghost"
        size="icon"
        title={`Télécharger la fiche PDF de ${visitorName}`}
      >
        <a href={`/api/admin/visitors/${visitorId}/pdf`}>
          <FileDown aria-hidden="true" />
          <span className="sr-only">Fiche PDF de {visitorName}</span>
        </a>
      </Button>

      <DeleteVisitorDialog
        visitorId={visitorId}
        visitorName={visitorName}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title={`Supprimer la fiche de ${visitorName}`}
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">Supprimer la fiche de {visitorName}</span>
          </Button>
        }
      />
    </div>
  );
}
