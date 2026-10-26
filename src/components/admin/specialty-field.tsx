import { SpecialtyCombobox } from "@/components/admin/specialty-combobox";
import { describedBy, FormField } from "@/components/ui/form-field";

/**
 * Spécialité de formation demandée : liste déroulante des formations du
 * formulaire visiteur, avec saisie libre si la spécialité n'y figure pas.
 * Un libellé de la liste, même tapé sans accents ni majuscules, est
 * enregistré sous sa forme officielle : les statistiques ne se fragmentent
 * pas.
 */
export function SpecialtyField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <FormField
      id={id}
      label="Spécialité"
      hint="Formation sur laquelle porte la demande."
      error={error}
    >
      <SpecialtyCombobox
        id={id}
        value={value}
        onChange={onChange}
        invalid={Boolean(error)}
        describedBy={describedBy(id, true, Boolean(error))}
      />
    </FormField>
  );
}
