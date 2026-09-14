"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ExportKind = "excel" | "pdf";

const ENDPOINTS: Record<ExportKind, string> = {
  excel: "/api/admin/exports/excel",
  pdf: "/api/admin/exports/pdf",
};

/**
 * Boutons d'export.
 *
 * Le téléchargement passe par `fetch` plutôt que par un lien direct afin de
 * pouvoir afficher un état de chargement et un message d'erreur lisible si
 * la génération échoue côté serveur.
 */
export function ExportButtons({ disabled = false }: { disabled?: boolean }) {
  const searchParams = useSearchParams();
  const [pending, setPending] = React.useState<ExportKind | null>(null);

  const download = async (kind: ExportKind) => {
    setPending(kind);

    try {
      const response = await fetch(
        `${ENDPOINTS[kind]}?${searchParams.toString()}`,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? "Export impossible.");
      }

      const blob = await response.blob();
      const filename =
        parseFilename(response.headers.get("Content-Disposition")) ??
        `visiteurs_anaqsup.${kind === "excel" ? "xlsx" : "pdf"}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Export terminé", { description: filename });
    } catch (error) {
      toast.error("Export impossible", {
        description:
          error instanceof Error
            ? error.message
            : "Veuillez réessayer dans un instant.",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 no-print">
      <Button
        type="button"
        variant="outline"
        onClick={() => download("excel")}
        disabled={disabled || pending !== null}
      >
        {pending === "excel" ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <FileSpreadsheet aria-hidden="true" />
        )}
        Exporter Excel
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => download("pdf")}
        disabled={disabled || pending !== null}
      >
        {pending === "pdf" ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <FileText aria-hidden="true" />
        )}
        Exporter PDF
      </Button>
    </div>
  );
}

/** Extrait le nom de fichier de l'en-tête Content-Disposition. */
function parseFilename(header: string | null) {
  if (!header) return null;

  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);

  const ascii = header.match(/filename="([^"]+)"/i);
  return ascii?.[1] ?? null;
}
