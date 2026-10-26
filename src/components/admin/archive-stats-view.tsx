import {
  CalendarRange,
  GraduationCap,
  Inbox,
  Repeat,
  UserRound,
} from "lucide-react";

import { StatCard } from "@/components/admin/stat-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { RankingChart } from "@/components/charts/ranking-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { monthLabel, monthShortLabel } from "@/lib/archive";
import type { ArchiveStats } from "@/types/archive";

const NUMBER = new Intl.NumberFormat("fr-FR");

/**
 * Statistiques d'un registre annuel du service aux usagers.
 *
 * Composant de présentation pur : il reçoit les agrégats déjà calculés, la
 * page se charge de les obtenir.
 */
export function ArchiveStatsView({ stats }: { stats: ArchiveStats }) {
  return (
    <div className="space-y-5">
      <section
        aria-label="Indicateurs du service aux usagers"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Sollicitations"
          value={stats.total}
          icon={<Inbox />}
          tone="navy"
        />
        <StatCard
          label="Usagers"
          value={stats.distinctUsers}
          icon={<UserRound />}
          tone="gold"
        />
        <StatCard
          label="Récurrents"
          value={stats.returningUsers}
          icon={<Repeat />}
          tone="success"
        />
        <StatCard
          label="Moyenne / mois"
          value={Math.round(stats.monthlyAverage * 10) / 10}
          icon={<CalendarRange />}
          tone="neutral"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Sollicitations par mois</CardTitle>
          <CardDescription>
            {stats.busiestMonth
              ? `Mois le plus chargé : ${monthLabel(stats.busiestMonth.month).toLowerCase()}, avec ${stats.busiestMonth.count} sollicitations.`
              : "Nombre de sollicitations reçues chaque mois."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={stats.monthly} year={stats.year} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spécialités demandées</CardTitle>
          <CardDescription>
            {stats.specialtyCount > 0
              ? `Les dix plus fréquentes. ${NUMBER.format(stats.specialtyCount)} sollicitation${stats.specialtyCount > 1 ? "s" : ""} sur ${NUMBER.format(stats.total)} précise${stats.specialtyCount > 1 ? "nt" : ""} une spécialité.`
              : "Formations sur lesquelles portent les demandes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.specialtyCount === 0 ? (
            <EmptyState
              icon={<GraduationCap className="size-5" />}
              title="Aucune spécialité renseignée pour le moment"
              description="Renseignez-la à l’ajout d’une sollicitation, ou sur les lignes existantes avec « Modifier »."
            />
          ) : (
            <RankingChart
              data={stats.specialties.slice(0, 10)}
              total={stats.specialtyCount}
              ariaLabel="Classement des spécialités les plus demandées"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Catégories d’expéditeurs</CardTitle>
            <CardDescription>
              Déduites du domaine : messagerie grand public, domaine .sn ou
              autre domaine professionnel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankingChart
              data={stats.categories}
              ariaLabel="Répartition des sollicitations par catégorie d'expéditeur"
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Messageries</CardTitle>
            <CardDescription>
              Domaines des adresses ayant écrit au service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={stats.domains}
              total={stats.total}
              centerLabel="sollicitations"
              unit="sollicitation"
              ariaLabel="Répartition des sollicitations par domaine de messagerie"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Détail par mois</CardTitle>
            <CardDescription>
              Sollicitations, part de l’année et usagers distincts.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 sm:pl-6">Mois</TableHead>
                  <TableHead className="text-right">Sollicitations</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Part</TableHead>
                  <TableHead className="pr-4 text-right sm:pr-6">Usagers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.monthly.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="pl-4 sm:pl-6">
                      {monthLabel(month.month)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {month.count}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                      {share(month.count, stats.total)}
                    </TableCell>
                    <TableCell className="pr-4 text-right tabular-nums sm:pr-6">
                      {month.distinctUsers}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-4 font-semibold sm:pl-6">Total</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {NUMBER.format(stats.total)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    100 %
                  </TableCell>
                  <TableCell className="pr-4 text-right font-semibold tabular-nums sm:pr-6">
                    {NUMBER.format(stats.distinctUsers)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Usagers les plus récurrents</CardTitle>
            <CardDescription>
              Adresses ayant sollicité le service plusieurs fois dans l’année.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topRequesters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun usager n’a écrit plus d’une fois.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {stats.topRequesters.map((requester) => (
                  <li
                    key={requester.email}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {requester.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {requester.label === requester.email
                          ? null
                          : `${requester.email} · `}
                        {requester.months.map(monthShortLabel).join(", ")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-gold-ink">
                      {requester.count} fois
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Part en pourcentage, arrondie à l'unité : « 42 % », « < 1 % ». */
function share(count: number, total: number) {
  if (total <= 0) return "-";
  const percent = Math.round((count / total) * 100);
  return count > 0 && percent === 0 ? "< 1 %" : `${percent} %`;
}
