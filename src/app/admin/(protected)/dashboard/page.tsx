import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  BarChart3,
  ExternalLink,
  CalendarDays,
  CalendarRange,
  Clock3,
  GraduationCap,
  Globe2,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
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
import { ORG } from "@/lib/constants";
import { getVisitorStats } from "@/lib/services/visitors";

export const metadata: Metadata = { title: "Tableau de bord" };

// Les compteurs doivent refléter l'état réel de la base à chaque affichage.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const identity = await requireAdmin();
  const greeting = (identity.fullName?.trim() || identity.email).split(" ")[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>

      {/* Bandeau d'accueil : rappelle l'identite de l'agent et ouvre sur les
          deux actions les plus frequentes a la prise de poste. */}
      <section className="overflow-hidden rounded-3xl bg-primary px-6 py-6 text-primary-foreground shadow-sm sm:px-8">
        <p className="text-xl font-semibold sm:text-2xl">
          Bonjour {greeting} 👋
        </p>
        <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
          Fréquentation de l&apos;accueil et principales demandes
          d&apos;information des visiteurs de l&apos;{ORG.shortName}.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="navy" size="sm">
            <Link href="/admin/visitors">
              <Users aria-hidden="true" />
              Consulter les visiteurs
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" />
              Ouvrir le formulaire
            </a>
          </Button>
        </div>
      </section>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const stats = await getVisitorStats();

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicateurs de fréquentation"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total des visiteurs"
          value={stats.total}
          hint="Depuis la mise en service"
          icon={<Users />}
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
        />
        <StatCard
          label="Ce mois-ci"
          value={stats.month}
          hint="Depuis le 1er du mois"
          icon={<CalendarRange />}
          tone="neutral"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Fréquentation des 14 derniers jours</CardTitle>
          <CardDescription>
            Nombre de fiches de présence enregistrées par jour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <EmptyState
              icon={<BarChart3 className="size-5" />}
              title="Aucune donnée à afficher"
              description="Les statistiques apparaîtront dès le premier visiteur enregistré."
            />
          ) : (
            <TrendChart data={stats.dailyTrend} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Principales formations recherchées</CardTitle>
            <CardDescription>
              Les six demandes les plus fréquentes.
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

        <Card>
          <CardHeader>
            <CardTitle>Principaux pays d&apos;origine</CardTitle>
            <CardDescription>
              Les six pays les plus représentés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topCountries.length === 0 ? (
              <EmptyState
                icon={<Globe2 className="size-5" />}
                title="Aucun pays enregistré"
              />
            ) : (
              <RankingChart
                data={stats.topCountries}
                ariaLabel="Classement des pays d'origine les plus représentés"
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[104px] w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}
