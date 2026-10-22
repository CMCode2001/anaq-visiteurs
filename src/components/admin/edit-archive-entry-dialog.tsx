"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { updateArchiveEntryAction } from "@/app/admin/actions";
import { SenderCategoryPreview } from "@/components/admin/sender-category-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { describedBy, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { monthLabel } from "@/lib/archive";
import {
  archiveEntryUpdateSchema,
  fieldErrorsOf,
  type ArchiveEntryUpdateValues,
  type FieldErrors,
} from "@/lib/validation/archive-entry";
import type { ArchiveEntry } from "@/types/archive";

/**
 * Correction du nom et de l'adresse d'une sollicitation.
 *
 * Un seul champ pour le nom : dans les lignes importées du registre,
 * prénom et nom ne sont pas séparables. La place de la ligne (mois,
 * numéro) n'est pas modifiable.
 */
export function EditArchiveEntryDialog({
  entry,
  trigger,
}: {
  entry: ArchiveEntry;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const initial = React.useMemo<ArchiveEntryUpdateValues>(
    () => ({ fullName: entry.fullName ?? "", email: entry.email }),
    [entry.fullName, entry.email],
  );

  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<
    FieldErrors<ArchiveEntryUpdateValues>
  >({});
  const [isPending, startTransition] = React.useTransition();

  const unchanged =
    values.fullName.trim() === initial.fullName &&
    values.email.trim().toLowerCase() === initial.email;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Chaque ouverture repart de la ligne telle qu'elle est en base.
    if (next) {
      setValues(initial);
      setErrors({});
    }
  };

  const update =
    (field: keyof ArchiveEntryUpdateValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = archiveEntryUpdateSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }

    startTransition(async () => {
      const result = await updateArchiveEntryAction(entry.id, values).catch(
        () => ({
          error: "Le serveur est injoignable. Veuillez réessayer.",
          success: undefined,
          fieldErrors: undefined,
        }),
      );

      if (result.success) {
        toast.success("Sollicitation modifiée", {
          description: result.success,
        });
        setOpen(false);
        router.refresh();
        return;
      }

      setErrors(result.fieldErrors ?? {});
      toast.error("Modification impossible", { description: result.error });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la sollicitation</DialogTitle>
          <DialogDescription>
            {monthLabel(entry.month)} {entry.year}, n° {entry.lineNumber}. Le
            mois et le numéro ne changent pas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <FormField
            id={`archive-edit-name-${entry.id}`}
            label="Nom de l’usager"
            hint="Laissez vide si seule l’adresse est connue."
            error={errors.fullName}
          >
            <Input
              id={`archive-edit-name-${entry.id}`}
              value={values.fullName}
              onChange={update("fullName")}
              autoComplete="off"
              autoFocus
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={describedBy(
                `archive-edit-name-${entry.id}`,
                true,
                Boolean(errors.fullName),
              )}
            />
          </FormField>

          <FormField
            id={`archive-edit-email-${entry.id}`}
            label="Email"
            required
            error={errors.email}
          >
            <Input
              id={`archive-edit-email-${entry.id}`}
              type="email"
              inputMode="email"
              value={values.email}
              onChange={update("email")}
              autoComplete="off"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy(
                `archive-edit-email-${entry.id}`,
                false,
                Boolean(errors.email),
              )}
            />
          </FormField>

          <SenderCategoryPreview email={values.email} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || unchanged}>
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
