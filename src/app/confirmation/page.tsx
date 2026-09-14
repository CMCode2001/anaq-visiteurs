import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ORG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Demande enregistrée",
};

export default function ConfirmationPage() {
  return (
    <div className="bg-institutional flex min-h-dvh flex-col">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6">
          <BrandMark height={36} tagline />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10 sm:px-6">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:p-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-9" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
               Merci pour votre visite auprès de <br/> l&apos;{ORG.shortName}.
              </h1>
              
            </div>

            

            <Button asChild size="lg">
              <Link href="/">
                <RotateCcw aria-hidden="true" />
                Retour
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
        {ORG.name}
      </footer>
    </div>
  );
}
