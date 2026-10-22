"use client";

import { Pencil, Trash2 } from "lucide-react";

import { DeleteArchiveEntryDialog } from "@/components/admin/delete-archive-entry-dialog";
import { EditArchiveEntryDialog } from "@/components/admin/edit-archive-entry-dialog";
import { Button } from "@/components/ui/button";
import type { ArchiveEntry } from "@/types/archive";

/** Corriger ou retirer une ligne des archives. */
export function ArchiveRowActions({ entry }: { entry: ArchiveEntry }) {
  const label = entry.fullName ?? entry.email;

  return (
    <div className="flex items-center justify-end gap-0.5">
      <EditArchiveEntryDialog
        entry={entry}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title={`Modifier la sollicitation de ${label}`}
          >
            <Pencil aria-hidden="true" />
            <span className="sr-only">Modifier la sollicitation de {label}</span>
          </Button>
        }
      />

      <DeleteArchiveEntryDialog
        entry={entry}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title={`Supprimer la sollicitation de ${label}`}
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">Supprimer la sollicitation de {label}</span>
          </Button>
        }
      />
    </div>
  );
}
