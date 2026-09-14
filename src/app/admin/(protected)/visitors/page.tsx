import type { Metadata } from "next";
import { Suspense } from "react";

import { ExportButtons } from "@/components/admin/export-buttons";
import { Pagination } from "@/components/admin/pagination";
import { VisitorsFilters } from "@/components/admin/visitors-filters";
import { VisitorsTable } from "@/components/admin/visitors-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getVisitorFacets, listVisitors } from "@/lib/services/visitors";
import { parseVisitorQuery, type RawSearchParams } from "@/lib/validation/filters";

export const metadata: Metadata = { title: "Visiteurs" };

export const dynamic = "force-dynamic";

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const query = parseVisitorQuery(params);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visiteurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez, filtrez et exportez les fiches de présence enregistrées.
          </p>
        </div>

        <ExportButtons />
      </div>

      <Suspense fallback={<Skeleton className="h-[15rem] w-full rounded-xl" />}>
        <FiltersSection query={query} />
      </Suspense>

      <Suspense
        key={JSON.stringify(query)}
        fallback={<Skeleton className="h-[22rem] w-full rounded-xl" />}
      >
        <VisitorsSection query={query} />
      </Suspense>
    </div>
  );
}

async function FiltersSection({
  query,
}: {
  query: ReturnType<typeof parseVisitorQuery>;
}) {
  const facets = await getVisitorFacets();

  return (
    <VisitorsFilters
      query={query}
      countries={facets.countries}
      formations={facets.formations}
    />
  );
}

async function VisitorsSection({
  query,
}: {
  query: ReturnType<typeof parseVisitorQuery>;
}) {
  const result = await listVisitors(query);

  return (
    <div className="space-y-4">
      <VisitorsTable result={result} query={query} />
      <Pagination result={result} query={query} />
    </div>
  );
}
