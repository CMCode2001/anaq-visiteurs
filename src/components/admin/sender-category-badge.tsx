import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { SenderCategory } from "@/lib/archive";
import { cn } from "@/lib/utils";

const CATEGORY_BADGES: Record<SenderCategory, BadgeProps["variant"]> = {
  Particulier: "secondary",
  "Organisme sénégalais": "default",
  "Autre organisme": "outline",
};

/** Catégorie d'expéditeur, même pastille dans la liste et le formulaire. */
export function SenderCategoryBadge({
  category,
  className,
}: {
  category: SenderCategory;
  className?: string;
}) {
  return (
    <Badge
      variant={CATEGORY_BADGES[category]}
      className={cn("whitespace-nowrap", className)}
    >
      {category}
    </Badge>
  );
}
