import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { monthLabel, senderCategory, type SenderCategory } from "@/lib/archive";
import { cn } from "@/lib/utils";
import { buildArchiveSearchParams } from "@/lib/validation/archive-filters";
import type {
  ArchiveSortField,
  PaginatedArchive,
  ResolvedArchiveQuery,
} from "@/types/archive";

const CATEGORY_BADGES: Record<SenderCategory, BadgeProps["variant"]> = {
  Particulier: "secondary",
  "Organisme sénégalais": "default",
  "Autre organisme": "outline",
};

/**
 * Tableau des archives (Server Component).
 *
 * Pas de fiche détaillée ici : le registre ne contient que le nom et
 * l'adresse. L'adresse est un lien `mailto:`, seule action utile sur une
 * ligne — répondre à l'usager.
 */
export function ArchiveTable({
  result,
  query,
}: {
  result: PaginatedArchive;
  query: ResolvedArchiveQuery;
}) {
  if (result.items.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="Aucune sollicitation ne correspond à ces critères"
        description="Modifiez la recherche ou le mois pour élargir les résultats."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead aria-sort={ariaSort(query, "month")}>
              <SortLink column="month" label="Mois" query={query} />
            </TableHead>
            <TableHead className="text-right">N°</TableHead>
            <TableHead aria-sort={ariaSort(query, "full_name")}>
              <SortLink column="full_name" label="Nom de l’usager" query={query} />
            </TableHead>
            <TableHead aria-sort={ariaSort(query, "email")}>
              <SortLink column="email" label="Email" query={query} />
            </TableHead>
            <TableHead>Catégorie</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {result.items.map((entry) => {
            const category = senderCategory(entry.email);

            return (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">
                  {monthLabel(entry.month)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {entry.lineNumber}
                </TableCell>
                <TableCell className="font-medium">
                  {entry.fullName ?? (
                    <span className="font-normal text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[22rem] truncate">
                  <a
                    href={`mailto:${entry.email}`}
                    title={`Écrire à ${entry.email}`}
                    className="rounded hover:text-gold-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    {entry.email}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={CATEGORY_BADGES[category]}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ariaSort(
  query: ResolvedArchiveQuery,
  field: ArchiveSortField,
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
  column: ArchiveSortField;
  label: string;
  query: ResolvedArchiveQuery;
}) {
  const isActive = query.sort === column;
  const nextDirection = isActive && query.direction === "asc" ? "desc" : "asc";

  const params = buildArchiveSearchParams({
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
      href={`/admin/archives?${params.toString()}`}
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
