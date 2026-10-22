import { SenderCategoryBadge } from "@/components/admin/sender-category-badge";
import { emailDomain, SENDER_CATEGORY_REASONS, senderCategory } from "@/lib/archive";
import { archiveEmailSchema } from "@/lib/validation/archive-entry";

/**
 * Catégorie d'expéditeur détectée pendant la saisie, à partir du domaine
 * de l'adresse : l'agent voit tout de suite s'il s'agit d'un particulier
 * ou d'un organisme, avant d'enregistrer.
 *
 * Elle n'est pas stockée : la liste, les exports et les statistiques la
 * recalculent de la même façon.
 */
export function SenderCategoryPreview({
  email,
  storedName,
}: {
  email: string;
  /** Nom tel qu'il sera enregistré, quand il diffère de la saisie. */
  storedName?: string | null;
}) {
  const parsed = archiveEmailSchema.safeParse(email);
  const category = parsed.success ? senderCategory(parsed.data) : null;

  return (
    <div
      aria-live="polite"
      className="space-y-2 rounded-2xl border border-border bg-muted/40 px-4 py-3"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Catégorie détectée
      </p>

      {category && parsed.success ? (
        <div className="flex flex-wrap items-center gap-2">
          <SenderCategoryBadge category={category} />
          <span className="text-sm text-muted-foreground">
            {SENDER_CATEGORY_REASONS[category]} ·{" "}
            <span className="font-medium text-foreground">
              {emailDomain(parsed.data)}
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
  );
}
