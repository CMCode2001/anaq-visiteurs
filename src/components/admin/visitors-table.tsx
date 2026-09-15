import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Users } from "lucide-react";

import { VisitorRowActions } from "@/components/admin/visitor-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPhoneDisplay, telHref } from "@/lib/phone";
import { cn, truncate } from "@/lib/utils";
import { buildVisitorSearchParams } from "@/lib/validation/filters";
import type {
  PaginatedVisitors,
  VisitorQuery,
  VisitorSortField,
} from "@/types/visitor";

const SORTABLE_COLUMNS: Array<{
  field: VisitorSortField;
  label: string;
}> = [
  { field: "first_name", label: "Prénom" },
  { field: "last_name", label: "Nom" },
  { field: "country", label: "Pays" },
];

/**
 * Tableau des visiteurs (Server Component).
 * Le tri passe par des liens : il fonctionne sans JavaScript et reste
 * partageable via l'URL.
 */
export function VisitorsTable({
  result,
  query,
}: {
  result: PaginatedVisitors;
  query: VisitorQuery;
}) {
  if (result.items.length === 0) {
    const filtered = Boolean(
      query.search ||
      query.country ||
      query.formation ||
      query.from ||
      query.to,
    );

    return (
      <EmptyState
        icon={<Users className="size-5" />}
        title={
          filtered
            ? "Aucun visiteur ne correspond à ces critères"
            : "Aucun visiteur enregistré pour le moment"
        }
        description={
          filtered
            ? "Modifiez la recherche, la période ou les filtres pour élargir les résultats."
            : "Les fiches apparaîtront ici dès qu'un visiteur aura rempli le formulaire d'accueil."
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {SORTABLE_COLUMNS.map((column) => (
              <TableHead
                key={column.field}
                aria-sort={ariaSort(query, column.field)}
              >
                <SortLink
                  column={column.field}
                  label={column.label}
                  query={query}
                />
              </TableHead>
            ))}
            <TableHead>Téléphone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead aria-sort={ariaSort(query, "formation_requested")}>
              <SortLink
                column="formation_requested"
                label="Formation recherchée"
                query={query}
              />
            </TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {result.items.map((visitor) => {
            const fullName = `${visitor.firstName} ${visitor.lastName}`;

            return (
              <TableRow key={visitor.id}>

                <TableCell className="font-medium">
                  <Link
                    href={`/admin/visitors/${visitor.id}`}
                    className="hover:text-gold-ink hover:underline"
                  >
                    {visitor.firstName}
                  </Link>
                </TableCell>

                <TableCell className="font-medium">
                  {visitor.lastName}
                </TableCell>
                <TableCell>{visitor.country}</TableCell>

                <TableCell className="whitespace-nowrap">
                  <a
                    href={telHref(visitor.phone)}
                    className="hover:text-gold-ink hover:underline"
                  >
                    {formatPhoneDisplay(visitor.phone)}
                  </a>
                </TableCell>

                <TableCell className="max-w-[16rem]">
                  {visitor.email ? (
                    <a
                      href={`mailto:${visitor.email}`}
                      className="block truncate hover:text-gold-ink hover:underline"
                      title={visitor.email}
                    >
                      {visitor.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell
                  className="max-w-[18rem]"
                  title={visitor.formationRequested}
                >
                  {truncate(visitor.formationRequested, 48)}
                </TableCell>


                <TableCell className="text-right">
                  <VisitorRowActions
                    visitorId={visitor.id}
                    visitorName={fullName}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Valeur `aria-sort` de la colonne, annoncée par les lecteurs d'écran. */
function ariaSort(
  query: VisitorQuery,
  field: VisitorSortField,
): "ascending" | "descending" | "none" {
  if (query.sort !== field) return "none";
  return query.direction === "asc" ? "ascending" : "descending";
}

/** En-tête cliquable : bascule asc/desc et repart en page 1. */
function SortLink({
  column,
  label,
  query,
}: {
  column: VisitorSortField;
  label: string;
  query: VisitorQuery;
}) {
  const isActive = query.sort === column;
  const nextDirection = isActive && query.direction === "desc" ? "asc" : "desc";

  const params = buildVisitorSearchParams({
    ...query,
    sort: column,
    direction: nextDirection,
    page: 1,
  });

  const Icon = !isActive
    ? ArrowUpDown
    : query.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <Link
      href={`/admin/visitors?${params.toString()}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:text-foreground",
        isActive && "text-gold-ink",
      )}
    >
      {label}
      <Icon className="size-3.5" aria-hidden="true" />
    </Link>
  );
}
