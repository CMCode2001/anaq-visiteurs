import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONSENT_VERSION, ORG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

/**
 * Emplacement prévu pour la politique de confidentialité officielle de
 * l'ANAQ-Sup. Le texte ci-dessous est un gabarit à faire valider par le
 * service juridique avant mise en production.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="bg-institutional min-h-dvh">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4 sm:px-6">
          <BrandMark height={36} tagline />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Retour au formulaire
          </Link>
        </Button>

        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Politique de confidentialité
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Version du texte de consentement : {CONSENT_VERSION}
              </p>
            </div>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Responsable du traitement</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {ORG.name} ({ORG.shortName}) est responsable du traitement des
                données collectées via la fiche de présence des visiteurs.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Données collectées</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Prénom et nom</li>
                <li>Pays d&apos;origine</li>
                <li>Numéro de téléphone</li>
                <li>Adresse email</li>
                <li>Formation recherchée</li>
                <li>
                  Date et version du consentement, date d&apos;enregistrement
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Finalité</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Les données sont collectées dans le seul but de traiter votre
                demande d&apos;information relative aux établissements
                d&apos;enseignement supérieur habilités et aux programmes
                accrédités, ainsi qu&apos;à des fins de statistiques internes
                d&apos;accueil.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Accès et conservation</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Seuls les agents habilités de l&apos;{ORG.shortName} disposant
                d&apos;un compte administrateur peuvent consulter ces données.
                Aucun visiteur ne peut accéder aux données d&apos;un autre
                visiteur. Les données ne font l&apos;objet d&apos;aucune cession
                à des tiers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Vos droits</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Vous disposez d&apos;un droit d&apos;accès, de rectification et
                de suppression de vos données. Pour l&apos;exercer, adressez
                votre demande à l&apos;accueil de l&apos;{ORG.shortName} ou au
                point de contact indiqué sur le site institutionnel.
              </p>
            </section>

            <p className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
              Gabarit à compléter et à valider par le service juridique de
              l&apos;{ORG.shortName} avant la mise en production.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
