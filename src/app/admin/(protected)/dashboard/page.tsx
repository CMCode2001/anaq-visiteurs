import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarDays,
  CalendarRange,
  Clock3,
  Globe2,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { RankingChart } from "@/components/charts/ranking-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateLong } from "@/lib/utils";
import { getVisitorStats } from "@/lib/services/visitors";

export const metadata: Metadata = { title: "Tableau de bord" };

// Les compteurs doivent refléter l'état réel de la base à chaque affichage.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const identity = await requireAdmin();
  const prenom = (identity.fullName?.trim() || identity.email).split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bonjour {prenom}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fréquentation de l&apos;accueil · {formatDateLong(new Date())}
          </p>
        </div>

        <Button asChild variant="navy" size="sm">
          <Link href="/admin/visitors">
            <Users aria-hidden="true" />
            Consulter les visiteurs
          </Link>
        </Button>
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const stats = await getVisitorStats();
  const vide = stats.total === 0;

  if (vide) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<Users className="size-5" />}
            title="Aucun visiteur enregistré pour le moment"
            description="Les indicateurs et les graphiques apparaîtront dès la première fiche de présence remplie à l'accueil."
            action={
              <Button asChild variant="outline" size="sm">
                <a href="/" target="_blank" rel="noreferrer">
                  Ouvrir le formulaire public
                </a>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <section
        aria-label="Indicateurs de fréquentation"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total"
          value={stats.total}
          hint="Depuis la mise en service"
          icon={<Users />}
          tone="navy"
        />
        <StatCard
          label="Aujourd'hui"
          value={stats.today}
          hint="Depuis minuit"
          icon={<Clock3 />}
          tone="success"
        />
        <StatCard
          label="Cette semaine"
          value={stats.week}
          hint="Depuis lundi"
          icon={<CalendarDays />}
          tone="gold"
        />
        <StatCard
          label="Ce mois-ci"
          value={stats.month}
          hint="Depuis le 1er du mois"
          icon={<CalendarRange />}
          tone="neutral"
        />
      </section>

      {/* Tendance en pleine largeur : c'est le graphique qui se lit de loin. */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Fréquentation des 14 derniers jours</CardTitle>
            <CardDescription>
              Nombre de fiches enregistrées par jour.
            </CardDescription>
          </div>
          <TrendingUp
            className="hidden size-5 shrink-0 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <TrendChart data={stats.dailyTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pays d&apos;origine</CardTitle>
            <CardDescription>
              Répartition des visiteurs par provenance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topCountries.length === 0 ? (
              <EmptyState
                icon={<Globe2 className="size-5" />}
                title="Aucun pays enregistré"
              />
            ) : (
              <DonutChart
                data={stats.topCountries}
                total={stats.total}
                centerLabel="visiteurs"
                ariaLabel="Répartition des visiteurs par pays d'origine"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formations les plus recherchées</CardTitle>
            <CardDescription>
              Les six demandes les plus fréquentes à l&apos;accueil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topFormations.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="size-5" />}
                title="Aucune formation enregistrée"
              />
            ) : (
              <RankingChart
                data={stats.topFormations}
                ariaLabel="Classement des formations les plus recherchées"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[108px] w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[330px] w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
