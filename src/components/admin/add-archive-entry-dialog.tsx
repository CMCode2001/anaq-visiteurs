"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { addArchiveEntryAction } from "@/app/admin/actions";
import { SenderCategoryBadge } from "@/components/admin/sender-category-badge";
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
import {
  composeArchiveName,
  emailDomain,
  SENDER_CATEGORY_REASONS,
  senderCategory,
} from "@/lib/archive";
import {
  archiveEntryFieldErrors,
  archiveEntrySchema,
  type ArchiveEntryFieldErrors,
  type ArchiveEntryFormValues,
} from "@/lib/validation/archive-entry";

const EMPTY: ArchiveEntryFormValues = { firstName: "", lastName: "", email: "" };

/**
 * Ajout d'une sollicitation reçue ce mois-ci.
 *
 * La catégorie d'expéditeur est détectée pendant la saisie, à partir du
 * domaine de l'adresse : l'agent voit tout de suite si l'usager écrit depuis
 * une messagerie personnelle ou depuis un organisme, avant d'enregistrer.
 * Elle n'est pas stockée : la liste, les exports et les statistiques la
 * recalculent de la même façon.
 */
export function AddArchiveEntryDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<ArchiveEntryFormValues>(EMPTY);
  const [errors, setErrors] = React.useState<ArchiveEntryFieldErrors>({});
  const [isPending, startTransition] = React.useTransition();

  const email = archiveEntrySchema.shape.email.safeParse(values.email);
  const category = email.success ? senderCategory(email.data) : null;
  const storedName = composeArchiveName(values.firstName, values.lastName);

  const update =
    (field: keyof ArchiveEntryFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      // L'erreur d'un champ disparaît dès qu'on le corrige.
      setErrors((current) => ({ ...current, [field]: undefined }));
    };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setValues(EMPTY);
      setErrors({});
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = archiveEntrySchema.safeParse(values);
    if (!parsed.success) {
      setErrors(archiveEntryFieldErrors(parsed.error));
      return;
    }

    startTransition(async () => {
      const result = await addArchiveEntryAction(values).catch(() => ({
        // Requête jamais arrivée (réseau coupé, déploiement en cours).
        error: "Le serveur est injoignable. Veuillez réessayer.",
        success: undefined,
        fieldErrors: undefined,
      }));

      if (result.success) {
        toast.success("Sollicitation ajoutée", { description: result.success });
        onOpenChange(false);
        router.refresh();
        return;
      }

      setErrors(result.fieldErrors ?? {});
      toast.error("Ajout impossible", { description: result.error });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          Ajouter
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle sollicitation</DialogTitle>
          <DialogDescription>
            Enregistrée dans le registre du mois en cours, à la suite des
            sollicitations déjà reçues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="archive-first-name"
              label="Prénom"
              error={errors.firstName}
            >
              <Input
                id="archive-first-name"
                value={values.firstName}
                onChange={update("firstName")}
                autoComplete="off"
                autoFocus
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={describedBy(
                  "archive-first-name",
                  false,
                  Boolean(errors.firstName),
                )}
              />
            </FormField>

            <FormField
              id="archive-last-name"
              label="Nom"
              error={errors.lastName}
            >
              <Input
                id="archive-last-name"
                value={values.lastName}
                onChange={update("lastName")}
                autoComplete="off"
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={describedBy(
                  "archive-last-name",
                  false,
                  Boolean(errors.lastName),
                )}
              />
            </FormField>
          </div>

          <p className="-mt-2 text-xs text-muted-foreground">
            Pour un organisme sans interlocuteur nommé, laissez le prénom vide
            et indiquez son nom.
          </p>

          <FormField
            id="archive-email"
            label="Email"
            required
            error={errors.email}
          >
            <Input
              id="archive-email"
              type="email"
              inputMode="email"
              value={values.email}
              onChange={update("email")}
              placeholder="nom@exemple.com"
              autoComplete="off"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy(
                "archive-email",
                false,
                Boolean(errors.email),
              )}
            />
          </FormField>

          <div
            aria-live="polite"
            className="space-y-2 rounded-2xl border border-border bg-muted/40 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Catégorie détectée
            </p>

            {category && email.success ? (
              <div className="flex flex-wrap items-center gap-2">
                <SenderCategoryBadge category={category} />
                <span className="text-sm text-muted-foreground">
                  {SENDER_CATEGORY_REASONS[category]} ·{" "}
                  <span className="font-medium text-foreground">
                    {emailDomain(email.data)}
                  </span>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Déduite du domaine dès que l’adresse est complète.
              </p>
            )}

            {storedName ? (
              <p className="text-sm text-muted-foreground">
                Nom enregistré :{" "}
                <span className="font-medium text-foreground">{storedName}</span>
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
