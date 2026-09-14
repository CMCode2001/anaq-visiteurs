/**
 * Copie les drapeaux SVG de `country-flag-icons` vers `public/flags/`.
 *
 * Pourquoi ne pas les importer depuis le JavaScript ?
 * `react-phone-number-input/flags` embarque les 250 drapeaux dans le bundle
 * (~1 Mo) - inacceptable pour un formulaire public consulté depuis une
 * tablette d'accueil. Servis en fichiers statiques et chargés en `lazy`,
 * seuls les drapeaux réellement visibles à l'écran sont téléchargés.
 *
 * Pourquoi ne pas utiliser le CDN par défaut de la librairie ?
 * Pour éviter une requête vers un tiers depuis le navigateur du visiteur
 * (confidentialité) et une dépendance réseau externe.
 *
 * Exécuté automatiquement par `npm install` (script `postinstall`),
 * donc également lors du build Vercel.
 */

import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SOURCE = path.join(
  process.cwd(),
  "node_modules",
  "country-flag-icons",
  "3x2",
);
const TARGET = path.join(process.cwd(), "public", "flags");

try {
  const files = (await readdir(SOURCE)).filter((file) => file.endsWith(".svg"));

  await mkdir(TARGET, { recursive: true });
  await cp(SOURCE, TARGET, { recursive: true });

  console.log(`[flags] ${files.length} drapeaux copiés vers public/flags/`);
} catch (error) {
  // Un échec ici ne doit jamais casser l'installation : l'interface retombe
  // sur le texte alternatif (le code pays) si un drapeau manque.
  console.warn(
    "[flags] copie impossible, les drapeaux seront remplacés par leur code pays :",
    error instanceof Error ? error.message : error,
  );
}
