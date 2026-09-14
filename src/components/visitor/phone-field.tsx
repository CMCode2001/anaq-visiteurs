"use client";

import PhoneInput from "react-phone-number-input";
import frLabels from "react-phone-number-input/locale/fr.json";

import { DEFAULT_COUNTRY } from "@/lib/countries";
import { cn } from "@/lib/utils";

import "react-phone-number-input/style.css";

interface PhoneFieldProps {
  id: string;
  /** Numéro au format international E.164, ex. « +221771234567 ». */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Champ téléphone international.
 *
 * Le sélecteur de pays ajuste l'indicatif, affiche le drapeau correspondant et
 * formate la saisie au fur et à mesure. La valeur remontée est toujours au
 * format E.164 (`+221771234567`), ce qui garantit des numéros homogènes en
 * base, cliquables (`tel:`) et exportables sans ambiguïté.
 *
 * Le sélecteur natif `<select>` de la librairie est conservé : il reste
 * accessible au clavier et déclenche le sélecteur natif sur mobile.
 */
export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
  invalid = false,
  describedBy,
}: PhoneFieldProps) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry={DEFAULT_COUNTRY as never}
      labels={frLabels}
      // Drapeaux servis localement plutôt que depuis le CDN de la librairie :
      // aucune requête vers un tiers depuis le navigateur du visiteur.
      flagUrl="/flags/{XX}.svg"
      value={value || undefined}
      onChange={(next) => onChange(next ?? "")}
      onBlur={onBlur}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      placeholder="77 123 45 67"
      autoComplete="tel"
      countrySelectProps={{ "aria-label": "Indicatif téléphonique du pays" }}
      className={cn(
        "anaq-phone flex h-11 w-full items-center gap-3 rounded-full border border-input bg-card px-4 shadow-sm transition-colors",
        "hover:border-primary/60",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-1 focus-within:ring-offset-[var(--background)]",
        invalid && "border-destructive",
      )}
    />
  );
}
