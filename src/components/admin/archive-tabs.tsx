import Link from "next/link";
import { BarChart3, List } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { key: "list", href: "/admin/archives", label: "Liste", icon: List },
  {
    key: "stats",
    href: "/admin/archives/statistiques",
    label: "Statistiques",
    icon: BarChart3,
  },
] as const;

/**
 * Bascule entre la liste et les statistiques d'un même registre.
 * L'année consultée suit d'un onglet à l'autre.
 */
export function ArchiveTabs({
  active,
  year,
}: {
  active: (typeof TABS)[number]["key"];
  year: number;
}) {
  return (
    <nav
      aria-label="Vues des archives"
      className="inline-flex rounded-full bg-muted p-1 no-print"
    >
      {TABS.map((tab) => {
        const current = tab.key === active;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.key}
            href={`${tab.href}?year=${year}`}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              current
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
