"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PenLine, X } from "lucide-react";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { normalize } from "@/lib/countries";
import { cn } from "@/lib/utils";

/** Valeurs cmdk réservées aux options hors liste. */
const FREE_TEXT = "__saisie-libre__";
const CLEAR = "__aucune__";

interface SuggestionComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Propositions de la liste ; la saisie libre reste toujours possible. */
  suggestions: readonly string[];
  /** Texte du champ tant que rien n'est choisi. */
  placeholder: string;
  /** Intitulé du groupe de propositions. */
  heading: string;
  icon: React.ReactNode;
  /** Libellé de l'option qui vide le champ ; absente si non fournie. */
  clearLabel?: string;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Liste déroulante de propositions, avec saisie libre.
 *
 * Même gabarit que le sélecteur de pays du formulaire visiteur : un clic
 * déplie toute la liste, la frappe la filtre sans tenir compte des accents,
 * des majuscules ni de l'ordre des mots. Si la valeur cherchée n'y figure
 * pas, l'option « Utiliser « … » » enregistre le texte tel que tapé.
 *
 * `modal` : dans une boîte de dialogue, le défilement hors d'elle est
 * bloqué ; sans cette option, la liste, rendue dans un portail, ne
 * défilerait pas à la molette.
 */
export function SuggestionCombobox({
  id,
  value,
  onChange,
  onBlur,
  suggestions,
  placeholder,
  heading,
  icon,
  clearLabel,
  invalid = false,
  describedBy,
}: SuggestionComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const typed = search.trim();
  const typedIsListed = suggestions.some(
    (label) => normalize(label) === normalize(typed),
  );

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    onBlur?.();
  };

  // Le champ n'est « quitté » qu'à la fermeture de la liste : ouvrir la
  // liste déplace le focus vers la recherche, et valider à ce moment
  // afficherait l'erreur d'un champ vide avant même le choix.
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setSearch("");
    else onBlur?.();
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          data-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-full border border-input bg-card px-5 text-left text-base shadow-sm transition-colors",
            "hover:border-primary/60",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]",
            "data-[invalid]:border-destructive",
            "md:text-sm",
            "[&>svg:first-child]:size-4 [&>svg:first-child]:shrink-0 [&>svg:first-child]:text-muted-foreground",
          )}
        >
          {icon}
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !value && "text-muted-foreground",
            )}
          >
            {value || placeholder}
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[16rem]"
        align="start"
      >
        <Command filter={filterSuggestion}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Rechercher ou saisir…"
          />

          <CommandList>
            <CommandGroup heading={heading}>
              {suggestions.map((label) => (
                <CommandItem
                  key={label}
                  value={label}
                  onSelect={() => choose(label)}
                >
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {normalize(label) === normalize(value) ? (
                    <Check
                      className="size-4 shrink-0 text-gold-ink"
                      aria-hidden="true"
                    />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>

            {/*
              Saisie libre en dernier : une proposition qui correspond reste
              présélectionnée, Entrée la choisit. Sans correspondance, cette
              option est la seule, donc présélectionnée.
            */}
            {typed && !typedIsListed ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Saisie libre">
                  <CommandItem value={FREE_TEXT} onSelect={() => choose(typed)}>
                    <PenLine
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      Utiliser « {typed} »
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}

            {clearLabel && value && !typed ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value={CLEAR} onSelect={() => choose("")}>
                    <X
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{clearLabel}</span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Recherche tolérante : accents, majuscules et ponctuation ignorés,
 * mots dans le désordre acceptés (« gaz petrole » trouve « Pétrole et Gaz »).
 * Les libellés qui commencent par la recherche remontent en tête.
 */
function filterSuggestion(itemValue: string, search: string) {
  // Toujours affichées, mais classées après toute proposition qui correspond.
  if (itemValue === FREE_TEXT || itemValue === CLEAR) return 0.01;

  const needle = normalize(search);
  if (!needle) return 1;

  const haystack = normalize(itemValue);
  if (haystack.startsWith(needle)) return 1;
  if (haystack.includes(needle)) return 0.8;

  const tokens = needle.split(" ").filter(Boolean);
  return tokens.every((token) => haystack.includes(token)) ? 0.5 : 0;
}
