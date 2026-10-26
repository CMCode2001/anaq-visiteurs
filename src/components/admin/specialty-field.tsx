import { describedBy, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SPECIALTY_SUGGESTIONS } from "@/lib/archive";

/**
 * Spécialité de formation demandée : saisie libre, avec la liste des
 * formations du formulaire visiteur en suggestion. Un libellé de la liste,
 * même saisi sans accents ni majuscules, est enregistré sous sa forme
 * officielle : les statistiques ne se fragmentent pas.
 */
export function SpecialtyField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const listId = `${id}-suggestions`;

  return (
    <FormField
      id={id}
      label="Spécialité"
      hint="Formation sur laquelle porte la demande."
      error={error}
    >
      <Input
        id={id}
        list={listId}
        value={value}
        onChange={onChange}
        placeholder="Ex. : Informatique / Génie logiciel"
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, true, Boolean(error))}
      />
      <datalist id={listId}>
        {SPECIALTY_SUGGESTIONS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </FormField>
  );
}
