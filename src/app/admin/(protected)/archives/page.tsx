import type { Metadata } from "next";
import { Suspense } from "react";

import { ArchiveEmptyNotice } from "@/components/admin/archive-empty";
import { ArchiveFilters } from "@/components/admin/archive-filters";
import { ArchiveTable } from "@/components/admin/archive-table";
import { ArchiveTabs } from "@/components/admin/archive-tabs";
import { ExportButtons } from "@/components/admin/export-buttons";
import { Pagination } from "@/components/admin/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getArchiveStats,
  listArchiveEntries,
  resolveArchiveQuery,
} from "@/lib/services/archives";
import {
  buildArchiveSearchParams,
  parseArchiveQuery,
} from "@/lib/validation/archive-filters";
import type { RawSearchParams } from "@/lib/validation/filters";
import type { ResolvedArchiveQuery } from "@/types/archive";

export const metadata: Metadata = { title: "Archives" };

export const dynamic = "force-dynamic";

const ARCHIVE_EXPORTS = {
  excel: "/api/admin/exports/archives/excel",
  pdf: "/api/admin/exports/archives/pdf",
};

export default async function ArchivesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { query, years } = await resolveArchiveQuery(
    parseArchiveQuery(await searchParams),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archives</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query
              ? `Registre du service aux usagers ${query.year} : sollicitations reçues par email, mois par mois.`
              : "Registres du service aux usagers."}
          </p>
        </div>

        {query ? <ExportButtons endpoints={ARCHIVE_EXPORTS} /> : null}
      </div>

      {query ? (
        <>
          <ArchiveTabs active="list" year={query.year} />

          <Suspense
            fallback={<Skeleton className="h-[11rem] w-full rounded-xl" />}
          >
            <FiltersSection query={query} years={years} />
          </Suspense>

          <Suspense
            key={JSON.stringify(query)}
            fallback={<Skeleton className="h-[22rem] w-full rounded-xl" />}
          >
            <ListSection query={query} />
          </Suspense>
        </>
      ) : (
        <ArchiveEmptyNotice />
      )}
    </div>
  );
}

async function FiltersSection({
  query,
  years,
}: {
  query: ResolvedArchiveQuery;
  years: number[];
}) {
  const stats = await getArchiveStats(query.year);

  return <ArchiveFilters query={query} years={years} months={stats.monthly} />;
}

async function ListSection({ query }: { query: ResolvedArchiveQuery }) {
  const result = await listArchiveEntries(query);

  return (
    <div className="space-y-4">
      <ArchiveTable result={result} query={query} />
      <Pagination
        result={result}
        itemLabel="Sollicitations"
        href={(page) =>
          `/admin/archives?${buildArchiveSearchParams({ ...query, page }).toString()}`
        }
      />
    </div>
  );
}
