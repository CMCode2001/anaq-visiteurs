"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { describedBy, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CountryCombobox } from "@/components/visitor/country-combobox";
import { PhoneField } from "@/components/visitor/phone-field";
import { CONSENT_TEXT, FORMATION_SUGGESTIONS, ORG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  visitorFormDefaults,
  visitorFormSchema,
  type VisitorFormValues,
} from "@/lib/validation/visitor";

/**
 * Formulaire public de fiche de présence.
 *
 * Validation en deux temps :
 *   1. côté client (Zod via react-hook-form) pour un retour immédiat ;
 *   2. côté serveur (même schéma) dans `POST /api/visitors`.
 */
export function VisitorForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: visitorFormDefaults,
    mode: "onBlur",
  });

  const onSubmit = async (values: VisitorFormValues) => {
    try {
      const response = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        toast.error("Enregistrement impossible", {
          description:
            payload?.message ??
            "Une erreur est survenue. Veuillez réessayer dans un instant.",
        });
        return;
      }

      reset(visitorFormDefaults);
      router.push("/confirmation");
    } catch {
      toast.error("Connexion interrompue", {
        description:
          "Vérifiez votre connexion internet puis soumettez à nouveau le formulaire.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
    <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="firstName"
          label="Prénom"
          required
          error={errors.firstName?.message}
        >
          <Input
            id="firstName"
            autoComplete="given-name"
            autoCapitalize="words"
            placeholder="Awa"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={describedBy("firstName", false, Boolean(errors.firstName))}
            {...register("firstName")}
          />
        </FormField>

        <FormField
          id="lastName"
          label="Nom"
          required
          error={errors.lastName?.message}
        >
          <Input
            id="lastName"
            autoComplete="family-name"
            autoCapitalize="words"
            placeholder="Diallo"
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={describedBy("lastName", false, Boolean(errors.lastName))}
            {...register("lastName")}
          />
        </FormField>

        <FormField
          id="country"
          label="Pays d'origine"
          required
          hint="Tapez les premières lettres pour filtrer la liste."
          error={errors.country?.message}
        >
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <CountryCombobox
                id="country"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.country)}
                describedBy={describedBy(
                  "country",
                  true,
                  Boolean(errors.country),
                )}
              />
            )}
          />
        </FormField>

        <FormField
          id="phone"
          label="Téléphone"
          required
          hint="Choisissez le pays puis saisissez le numéro."
          error={errors.phone?.message}
        >
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneField
                id="phone"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.phone)}
                describedBy={describedBy("phone", true, Boolean(errors.phone))}
              />
            )}
          />
        </FormField>

        <FormField
          id="email"
          label="Email"
          required
          className="sm:col-span-2"
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nom@exemple.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email", false, Boolean(errors.email))}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="establishment"
          label="Établissement concerné"
          className="sm:col-span-2"
          hint="Facultatif : laissez vide si votre question porte sur plusieurs établissements."
          error={errors.establishment?.message}
        >
          <Input
            id="establishment"
            autoComplete="organization"
            placeholder="Université Cheikh Anta Diop de Dakar"
            aria-invalid={Boolean(errors.establishment)}
            aria-describedby={describedBy(
              "establishment",
              true,
              Boolean(errors.establishment),
            )}
            {...register("establishment")}
          />
        </FormField>

        <FormField
          id="formationRequested"
          label="Formation recherchée"
          required
          className="sm:col-span-2"
          hint="Précisez la filière ou le programme qui vous intéresse."
          error={errors.formationRequested?.message}
        >
          <Input
            id="formationRequested"
            list="formation-suggestions"
            placeholder="Informatique / Génie logiciel"
            aria-invalid={Boolean(errors.formationRequested)}
            aria-describedby={describedBy(
              "formationRequested",
              true,
              Boolean(errors.formationRequested),
            )}
            {...register("formationRequested")}
          />
          <datalist id="formation-suggestions">
            {FORMATION_SUGGESTIONS.map((formation) => (
              <option key={formation} value={formation} />
            ))}
          </datalist>
        </FormField>
      </div>

      {/* ---------------------- Consentement obligatoire ---------------------- */}
      <div
        className={cn(
          "rounded-2xl border bg-gold-soft/60 p-5 transition-colors",
          errors.consentGiven ? "border-destructive" : "border-border",
        )}
      >
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consentGiven"
            render={({ field }) => (
              <Checkbox
                id="consentGiven"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.consentGiven)}
                aria-describedby={describedBy(
                  "consentGiven",
                  true,
                  Boolean(errors.consentGiven),
                )}
                className="mt-0.5"
              />
            )}
          />

          <div className="space-y-2">
            <label
              htmlFor="consentGiven"
              className="block cursor-pointer text-sm leading-relaxed text-foreground"
            >
              {CONSENT_TEXT}{" "}
              <span className="font-semibold text-destructive">*</span>
            </label>

            <p id="consentGiven-hint" className="text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline size-3.5 align-[-2px]" />
              Vos données sont conservées de manière sécurisée et ne sont
              accessibles qu&apos;aux agents habilités de l&apos;{ORG.shortName}.{" "}
              <Link
                href={ORG.privacyPolicyUrl}
                className="font-medium text-gold-ink underline underline-offset-2"
              >
                Politique de confidentialité
              </Link>
            </p>

            {errors.consentGiven ? (
              <p
                id="consentGiven-error"
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {errors.consentGiven.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset(visitorFormDefaults)}
          disabled={isSubmitting}
          className="sm:w-auto"
        >
          Réinitialiser
        </Button>

        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              Enregistrer ma visite
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
