"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";

import {
  Command,
  CommandEmpty,
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
import {
  OTHER_COUNTRIES,
  PRIORITY_COUNTRIES,
  countryCodeFromName,
  flagUrl,
  normalize,
  type Country,
} from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountryComboboxProps {
  id: string;
  /** Libellé français du pays, ex. « Sénégal » — valeur stockée en base. */
  value: string;
  onChange: (countryName: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Sélecteur de pays : liste complète (250 pays), recherche insensible aux
 * accents et à la casse, navigation entièrement au clavier.
 *
 * Les pays les plus fréquents à l'accueil de l'ANAQ-Sup sont épinglés en tête
 * de liste : un agent saisit « Sénégal » en deux touches.
 */
export function CountryCombobox({
  id,
  value,
  onChange,
  onBlur,
  invalid = false,
  describedBy,
}: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selectedCode = countryCodeFromName(value);

  const select = (country: Country) => {
    onChange(country.name);
    setOpen(false);
    onBlur?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/*
          Pas de `role="combobox"` ici : Radix pose déjà `aria-haspopup="dialog"`,
          `aria-expanded` et `aria-controls` sur le déclencheur. Le motif réel
          est bien « bouton → dialogue contenant une liste », et non un combobox
          ARIA 1.2 — le lecteur d'écran annonce le pays choisi puis l'état
          déplié / replié.
        */}
        <button
          type="button"
          id={id}
          // `aria-invalid` ne s'applique qu'aux widgets de saisie, pas à un
          // bouton : l'erreur est portée par `aria-describedby` (le message a
          // role="alert") et signalée visuellement via `data-invalid`.
          data-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-full border border-input bg-card px-4 text-left text-base shadow-sm transition-colors",
            "hover:border-primary/60",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]",
            "data-[invalid]:border-destructive",
            "md:text-sm",
          )}
        >
          {selectedCode ? (
            <Flag code={selectedCode} />
          ) : (
            <Globe2
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}

          <span
            className={cn(
              "flex-1 truncate",
              !value && "text-muted-foreground",
            )}
          >
            {value || "Sélectionnez votre pays"}
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
        <Command filter={filterCountry}>
          <CommandInput placeholder="Rechercher un pays…" />

          <CommandList>
            <CommandEmpty>Aucun pays ne correspond à cette recherche.</CommandEmpty>

            <CommandGroup heading="Fréquemment sélectionnés">
              {PRIORITY_COUNTRIES.map((country) => (
                <CountryItem
                  key={`priority-${country.code}`}
                  country={country}
                  selected={country.code === selectedCode}
                  onSelect={() => select(country)}
                />
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Autres pays">
              {OTHER_COUNTRIES.map((country) => (
                <CountryItem
                  key={country.code}
                  country={country}
                  selected={country.code === selectedCode}
                  onSelect={() => select(country)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CountryItem({
  country,
  selected,
  onSelect,
}: {
  country: Country;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`${country.name} ${country.code}`}
      onSelect={onSelect}
    >
      <Flag code={country.code} />
      <span className="flex-1 truncate">{country.name}</span>
      {selected ? (
        <Check className="size-4 shrink-0 text-gold-ink" aria-hidden="true" />
      ) : null}
    </CommandItem>
  );
}

/**
 * Drapeau servi depuis `public/flags/`. `loading="lazy"` est essentiel :
 * la liste compte 250 entrées, seules celles visibles à l'écran déclenchent
 * un téléchargement.
 */
function Flag({ code }: { code: string }) {
  return (
    // `next/image` n'a rien à optimiser sur un SVG de 2 Ko et introduirait
    // 250 requêtes vers le pipeline d'optimisation. Une balise <img> native
    // en chargement différé est ici le bon outil.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(code)}
      alt=""
      aria-hidden="true"
      width={24}
      height={16}
      loading="lazy"
      decoding="async"
      className="h-4 w-6 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10"
    />
  );
}

/**
 * Recherche tolérante, pensée pour la saisie rapide d'un agent d'accueil :
 *   « senegal »      → Sénégal      (accents ignorés)
 *   « SN »           → Sénégal      (code ISO)
 *   « cote divoire » → Côte d'Ivoire (apostrophes et espaces ignorés)
 *   « ivoire cote »  → Côte d'Ivoire (mots dans le désordre)
 *
 * Le score décroît à mesure que la correspondance s'éloigne : les pays dont
 * le nom *commence* par la recherche remontent en tête.
 */
function filterCountry(itemValue: string, search: string) {
  const needle = normalize(search);
  if (!needle) return 1;

  const haystack = normalize(itemValue);
  if (haystack.startsWith(needle)) return 1;
  if (haystack.includes(needle)) return 0.8;

  // Comparaison sans séparateurs : « cote divoire » ≈ « cote d ivoire ».
  const squashedHaystack = haystack.replaceAll(" ", "");
  const squashedNeedle = needle.replaceAll(" ", "");
  if (squashedHaystack.startsWith(squashedNeedle)) return 0.7;
  if (squashedHaystack.includes(squashedNeedle)) return 0.6;

  // Tous les mots saisis présents, quel que soit leur ordre.
  const tokens = needle.split(" ").filter(Boolean);
  if (
    tokens.length > 1 &&
    tokens.every((token) => squashedHaystack.includes(token))
  ) {
    return 0.4;
  }

  return 0;
}
