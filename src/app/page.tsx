import { BrandMark } from "@/components/brand-mark";
import { VisitorForm } from "@/components/visitor/visitor-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ORG } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="bg-institutional min-h-dvh">
      {/*
        Aucun lien vers /admin n'est exposé au public : les visiteurs n'ont pas
        à connaître l'existence de l'espace d'administration. Les agents
        habilités accèdent à /admin/login par l'URL directe.
      */}
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6">
          <BrandMark height={36} tagline />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {ORG.formTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            {ORG.formSubtitle}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vos informations</CardTitle>
            <CardDescription>
              Merci de renseigner ces quelques informations afin que nos agents
              puissent traiter votre demande d&apos;information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <VisitorForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {ORG.name} — {ORG.shortName}
        </p>
      </main>
    </div>
  );
}
