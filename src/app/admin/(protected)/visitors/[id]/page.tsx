import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  FileDown,
  Globe2,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  ShieldX,
  User,
} from "lucide-react";

import { DeleteVisitorDialog } from "@/components/admin/delete-visitor-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getVisitor } from "@/lib/services/visitors";
import { formatPhoneDisplay, telHref } from "@/lib/phone";
import {
  formatDateTime,
  formatFirstName,
  formatFullName,
  formatLastName,
  initials,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Fiche visiteur" };

export const dynamic = "force-dynamic";

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Un identifiant malformé ne doit jamais atteindre la base.
  if (!z.string().uuid().safeParse(id).success) notFound();

  const visitor = await getVisitor(id);
  if (!visitor) notFound();

  const fullName = formatFullName(visitor.firstName, visitor.lastName);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="no-print">
        <Link href="/admin/visitors">
          <ArrowLeft aria-hidden="true" />
          Retour à la liste
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-gold-ink"
          >
            {initials(visitor.firstName, visitor.lastName)}
          </span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enregistré le {formatDateTime(visitor.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 no-print">
          <Button asChild variant="outline">
            <a href={`/api/admin/visitors/${visitor.id}/pdf`}>
              <FileDown aria-hidden="true" />
              Générer la fiche PDF
            </a>
          </Button>

          <DeleteVisitorDialog
            visitorId={visitor.id}
            visitorName={fullName}
            redirectTo="/admin/visitors"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations du visiteur</CardTitle>
            <CardDescription>
              Données déclarées lors du passage à l&apos;accueil.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">
            <DetailRow
              icon={<User className="size-4" />}
              label="Prénom"
              value={formatFirstName(visitor.firstName)}
            />
            <Separator />
            <DetailRow
              icon={<User className="size-4" />}
              label="Nom"
              value={formatLastName(visitor.lastName)}
            />
            <Separator />
            <DetailRow
              icon={<Globe2 className="size-4" />}
              label="Pays d'origine"
              value={visitor.country}
            />
            <Separator />
            <DetailRow
              icon={<Phone className="size-4" />}
              label="Téléphone"
              value={
                <a
                  href={telHref(visitor.phone)}
                  className="hover:text-gold-ink hover:underline"
                >
                  {formatPhoneDisplay(visitor.phone)}
                </a>
              }
            />
            <Separator />
            <DetailRow
              icon={<Mail className="size-4" />}
              label="Email"
              value={
                visitor.email ? (
                  <a
                    href={`mailto:${visitor.email}`}
                    className="break-all hover:text-gold-ink hover:underline"
                  >
                    {visitor.email}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <Separator />
            <DetailRow
              icon={<Building2 className="size-4" />}
              label="Établissement concerné"
              value={visitor.establishment ?? "-"}
            />
            <Separator />
            <DetailRow
              icon={<GraduationCap className="size-4" />}
              label="Formation recherchée"
              value={visitor.formationRequested}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consentement</CardTitle>
            <CardDescription>
              Traçabilité de l&apos;accord donné par le visiteur.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
              {visitor.consentGiven ? (
                <>
                  <ShieldCheck
                    className="size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <div>
                    <Badge variant="success">Consentement accordé</Badge>
                  </div>
                </>
              ) : (
                <>
                  <ShieldX
                    className="size-5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <Badge variant="destructive">Consentement absent</Badge>
                </>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">
                  Version du consentement
                </dt>
                <dd className="font-medium">{visitor.consentVersion ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date du consentement</dt>
                <dd className="font-medium tabular-nums">
                  {formatDateTime(visitor.consentDate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date de création</dt>
                <dd className="font-medium tabular-nums">
                  {formatDateTime(visitor.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dernière mise à jour</dt>
                <dd className="font-medium tabular-nums">
                  {formatDateTime(visitor.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Identifiant</dt>
                <dd className="break-all font-mono text-xs">{visitor.id}</dd>
              </div>
            </dl>

            <p className="flex items-start gap-2 rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
              <CalendarClock
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              Les horodatages sont générés par le serveur et ne peuvent pas être
              modifiés depuis l&apos;application.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
