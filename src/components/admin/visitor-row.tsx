"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { VisitorRowActions } from "@/components/admin/visitor-row-actions";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  formatFirstName,
  formatFullName,
  formatLastName,
  truncate,
} from "@/lib/utils";
import type { Visitor } from "@/types/visitor";

/**
 * Ligne du tableau des visiteurs, cliquable dans son ensemble.
 *
 * Le prénom reste un vrai lien : c’est lui qui porte l’accessibilité —
 * navigation au clavier, annonce par les lecteurs d’écran, ouverture dans un
 * nouvel onglet, préchargement au survol. Le `onClick` posé sur la ligne n’est
 * qu’une commodité pour la souris, il n’en est pas le seul moyen d’accès.
 *
 * La cellule d’actions interrompt la propagation : supprimer une fiche ou
 * télécharger son PDF ne doit pas ouvrir la fiche au passage.
 */
export function VisitorRow({ visitor }: { visitor: Visitor }) {
  const router = useRouter();

  const href = `/admin/visitors/${visitor.id}`;
  const fullName = formatFullName(visitor.firstName, visitor.lastName);

  return (
    <TableRow
      onClick={() => router.push(href)}
      className="cursor-pointer"
      title={`Ouvrir la fiche de ${fullName}`}
    >
      <TableCell className="font-medium">
        <Link
          href={href}
          onClick={(event) => event.stopPropagation()}
          className="rounded hover:text-gold-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {formatFirstName(visitor.firstName)}
        </Link>
      </TableCell>

      <TableCell className="font-semibold">
        {formatLastName(visitor.lastName)}
      </TableCell>

      <TableCell>{visitor.country}</TableCell>

      <TableCell
        className="max-w-[18rem]"
        title={visitor.establishment ?? undefined}
      >
        {visitor.establishment ? (
          truncate(visitor.establishment, 38)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/*
        Le numéro reste en texte simple ici : un lien `tel:` au milieu d’une
        ligne cliquable oblige l’agent à viser. Il redevient cliquable sur la
        fiche détaillée, là où c’est l’action attendue.
      */}
      <TableCell className="whitespace-nowrap tabular-nums">
        {formatPhoneDisplay(visitor.phone)}
      </TableCell>

      <TableCell
        className="max-w-[20rem]"
        title={visitor.formationRequested}
      >
        {truncate(visitor.formationRequested, 46)}
      </TableCell>

      <TableCell
        className="text-right"
        onClick={(event) => event.stopPropagation()}
      >
        <VisitorRowActions visitorId={visitor.id} visitorName={fullName} />
      </TableCell>
    </TableRow>
  );
}
