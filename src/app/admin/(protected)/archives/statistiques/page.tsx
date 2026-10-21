import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ArchiveEmptyNotice } from "@/components/admin/archive-empty";
import { ArchiveStatsView } from "@/components/admin/archive-stats-view";
import { ArchiveTabs } from "@/components/admin/archive-tabs";
import { ExportButtons } from "@/components/admin/export-buttons";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchiveStats, resolveArchiveQuery } from "@/lib/services/archives";
import { cn } from "@/lib/utils";
import { parseArchiveQuery } from "@/lib/validation/archive-filters";
import type { RawSearchParams } from "@/lib/validation/filters";

export const metadata: Metadata = { title: "Statistiques des archives" };

export const dynamic = "force-dynamic";

export default async function ArchiveStatsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { query, years } = await resolveArchiveQuery(
    parseArchiveQuery(await searchParams),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archives</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query
              ? `Statistiques du service aux usagers ${query.year}. Un usager est identifié par son adresse email.`
              : "Registres du service aux usagers."}
          </p>
        </div>

        {query ? (
          <ExportButtons
            endpoints={{ pdf: "/api/admin/exports/archives/stats" }}
          />
        ) : null}
      </div>

      {query ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ArchiveTabs active="stats" year={query.year} />
            {years.length > 1 ? (
              <YearLinks years={years} current={query.year} />
            ) : null}
          </div>

          <Suspense key={query.year} fallback={<StatsSkeleton />}>
            <StatsContent year={query.year} />
          </Suspense>
        </>
      ) : (
        <ArchiveEmptyNotice />
      )}
    </div>
  );
}

async function StatsContent({ year }: { year: number }) {
  const stats = await getArchiveStats(year);
  return <ArchiveStatsView stats={stats} />;
}

/** Choix de l'année, sous forme de liens : aucun JavaScript nécessaire. */
function YearLinks({ years, current }: { years: number[]; current: number }) {
  return (
    <nav aria-label="Année du registre" className="flex flex-wrap gap-2">
      {years.map((year) => (
        <Link
          key={year}
          href={`/admin/archives/statistiques?year=${year}`}
          aria-current={year === current ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            year === current
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {year}
        </Link>
      ))}
    </nav>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[84px] w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[350px] w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
