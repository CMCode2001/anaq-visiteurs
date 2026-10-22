"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteArchiveEntryAction, type ActionState } from "@/app/admin/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { monthLabel } from "@/lib/archive";
import type { ArchiveEntry } from "@/types/archive";

/** Bouton de confirmation : l'état de chargement suit la Server Action. */
function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
      Supprimer définitivement
    </Button>
  );
}

/** Confirmation obligatoire avant de retirer une ligne du registre. */
export function DeleteArchiveEntryDialog({
  entry,
  trigger,
}: {
  entry: ArchiveEntry;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    deleteArchiveEntryAction,
    {},
  );

  React.useEffect(() => {
    if (state.success) {
      toast.success("Sollicitation supprimée", { description: state.success });
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Suppression impossible", { description: state.error });
    }
  }, [state, router]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette sollicitation ?</AlertDialogTitle>
          <AlertDialogDescription>
            La ligne n° {entry.lineNumber} de {monthLabel(entry.month).toLowerCase()}{" "}
            {entry.year} (
            <strong className="text-foreground">
              {entry.fullName ?? entry.email}
            </strong>
            ) sera définitivement retirée des archives. Les numéros des autres
            lignes ne changent pas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction}>
          <input type="hidden" name="id" value={entry.id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Annuler</AlertDialogCancel>
            <ConfirmButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
