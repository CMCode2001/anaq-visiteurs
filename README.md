# ANAQ-Sup -Fiche de présence des visiteurs

Application web de dématérialisation de la fiche de présence des visiteurs de
l'**ANAQ-Sup** (Autorité Nationale d'Assurance Qualité de l'Enseignement
Supérieur).

Les visiteurs se présentent à l'accueil pour obtenir des informations sur les
établissements d'enseignement supérieur habilités et les programmes accrédités.
Cette application remplace la fiche papier par un formulaire en ligne, avec
recueil du consentement, tableau de bord et exports.

---

## 1. Fonctionnalités

**Interface publique**

- Formulaire responsive (ordinateur, tablette, smartphone)
- Champs obligatoires : prénom, nom, pays d'origine, téléphone, email, formation recherchée
- **Sélecteur de pays** : les 250 pays avec drapeau, recherche insensible aux
  accents et aux séparateurs (« cote divoire » trouve « Côte d'Ivoire »), pays
  fréquents épinglés en tête, navigation entièrement au clavier
- **Téléphone international** : indicatif et drapeau par pays, formatage à la
  saisie et validation réelle du numéro (pas un simple contrôle de format)
- Suggestions de saisie (pays et formations) pour un remplissage rapide
- Case de consentement obligatoire, versionnée et horodatée côté serveur
- Page de confirmation avec retour immédiat au formulaire pour le visiteur suivant
- Page « Politique de confidentialité » (gabarit à faire valider juridiquement)

**Espace administrateur** (`/admin`, authentifié -**non lié depuis les pages
publiques** : les visiteurs n'ont pas à connaître son existence, les agents
habilités y accèdent par l'URL directe)

- Tableau de bord : total, aujourd'hui, cette semaine, ce mois-ci
- Graphiques : fréquentation sur 14 jours, top formations, top pays
- Liste des visiteurs : recherche plein texte, tri, pagination, filtres par
  période / pays / formation
- Fiche détaillée d'un visiteur, avec traçabilité complète du consentement
- Suppression avec confirmation obligatoire
- Export **Excel** (`.xlsx`) et **PDF** de la liste filtrée
- Génération d'une **fiche PDF individuelle**

---

## 2. Stack technique

| Domaine                 | Choix                                        |
| ----------------------- | -------------------------------------------- |
| Framework               | Next.js 15 (App Router) + React 19           |
| Langage                 | TypeScript (strict)                          |
| Styles                  | Tailwind CSS v4                              |
| Composants              | shadcn/ui (Radix UI)                         |
| Base de données         | PostgreSQL via Supabase                      |
| Authentification        | Supabase Auth                                |
| Validation              | Zod (client **et** serveur)                  |
| Sélecteur de pays       | cmdk + Radix Popover (recherche clavier)     |
| Téléphone international | react-phone-number-input + libphonenumber-js |
| Graphiques              | Recharts                                     |
| Export Excel            | SheetJS (`xlsx`)                             |
| Export PDF              | jsPDF + jspdf-autotable                      |
| Déploiement             | Vercel                                       |

Aucun serveur backend dédié : **Supabase joue le rôle de Backend-as-a-Service**,
ce qui réduit le coût d'infrastructure et de maintenance de la V1.

---

## 3. Architecture

```text
src/
├── app/
│   ├── page.tsx                     # Formulaire public
│   ├── confirmation/                # Page de confirmation
│   ├── politique-confidentialite/
│   ├── admin/
│   │   ├── actions.ts               # Server Actions (connexion, suppression)
│   │   ├── login/                   # Connexion administrateur
│   │   └── (protected)/             # Groupe de routes protégées
│   │       ├── layout.tsx           # requireAdmin() + coquille d'admin
│   │       ├── dashboard/
│   │       └── visitors/[id]/
│   └── api/
│       ├── visitors/                # POST public (enregistrement)
│       └── admin/
│           ├── exports/excel|pdf/
│           └── visitors/[id]/pdf/
│
├── components/
│   ├── ui/                          # Primitives shadcn/ui
│   ├── visitor/                     # Formulaire public
│   ├── admin/                       # Tableau, filtres, exports, dialogues
│   └── charts/                      # Graphiques Recharts
│
├── lib/
│   ├── supabase/                    # client / server / admin / middleware
│   ├── repositories/                # Accès aux données (contrat + Supabase)
│   ├── services/                    # Logique métier
│   ├── validation/                  # Schémas Zod
│   ├── exports/                     # Excel, PDF, nommage de fichiers
│   ├── auth/                        # Garde d'accès administrateur
│   ├── security/                    # Limitation de débit
│   └── constants.ts, env.ts, utils.ts
│
├── types/                           # Modèle métier + typage de la base
└── middleware.ts                    # Rafraîchissement de session + garde /admin

supabase/migrations/                 # Schéma SQL, RLS, compte administrateur
```

**Séparation des responsabilités**

- **UI** : `components/`
- **Logique métier** : `lib/services/`
- **Accès aux données** : `lib/repositories/`
- **Validation** : `lib/validation/`
- **Export** : `lib/exports/`
- **Authentification** : `lib/auth/` + `lib/supabase/`

### Remplacer Supabase plus tard

Les pages et composants ne connaissent jamais Supabase : ils appellent
`lib/services/visitors.ts`, qui délègue à l'interface `VisitorRepository`
(`lib/repositories/visitor-repository.ts`).

Pour basculer vers une API backend classique, il suffit d'écrire une classe
`HttpVisitorRepository implements VisitorRepository` et de la retourner depuis
`lib/repositories/index.ts`. Aucune page, aucun composant, aucun export n'a
besoin d'être modifié.

---

## 3 bis. Charte graphique

Deux couleurs seulement, reprises du logotype officiel :

| Rôle           | Couleur   | Usage                                            |
| -------------- | --------- | ------------------------------------------------ |
| Or ANAQ-Sup    | `#c29e16` | boutons, états actifs, graphiques, filet des PDF |
| Marine profond | `#042244` | texte, titres, bandeau des PDF, anneau de focus  |
| Or foncé       | `#8a6f0f` | texte doré sur fond clair (liens, libellés)      |

Aucun bleu clair n'est utilisé : le seul bleu de la charte est le marine.

Contrastes vérifiés (WCAG AA) :

- or `#c29e16` + libellé marine `#042244` → **6,2:1** (boutons)
- marine `#042244` sur blanc → **15,9:1** (texte courant)
- or foncé `#8a6f0f` sur blanc → **4,8:1** (texte doré)

L'or pur n'est jamais employé comme couleur de texte sur fond clair (2,6:1,
sous le seuil AA) : il sert uniquement d'aplat. Les formes sont pleinement
arrondies -boutons, champs, listes déroulantes et pastilles en `rounded-full`,
cartes et panneaux en `rounded-2xl`.

---

## 3 ter. Pays et téléphone

### Un référentiel unique

`src/lib/countries.ts` construit la liste des pays à partir des codes ISO 3166-1
de `libphonenumber-js` et des libellés français de `react-phone-number-input`.
Aucune liste maintenue à la main : le sélecteur de pays, l'indicatif
téléphonique et les drapeaux partagent la même source.

Le **libellé français** est la valeur stockée en base (colonne `country`), ce
qui garde les exports lisibles sans jointure. Il est **canonisé côté serveur** :
`senegal`, `SÉNÉGAL` ou `Senegal` sont tous enregistrés `Sénégal`. Les
statistiques et les filtres ne peuvent donc pas se fragmenter en doublons.

Pour changer les pays épinglés en tête de liste, modifier
`PRIORITY_COUNTRY_CODES` dans le même fichier.

### Format de stockage des numéros

Les numéros sont stockés au format **E.164** (`+221771234567`) : compact, non
ambigu, indépendant des conventions locales. Ils ne sont mis en forme qu'à
l'affichage - `formatPhoneDisplay()` dans `src/lib/phone.ts` produit
`+221 77 123 45 67` à l'écran, dans Excel et dans les PDF.

La validation utilise `isValidPhoneNumber` : longueur **et** préfixe opérateur
sont vérifiés pour le pays de l'indicatif. Un `+221 99 999 99 99`, correct en
apparence, est rejeté car aucun opérateur sénégalais n'utilise ce préfixe.

### Drapeaux

`scripts/copy-flags.mjs` copie les 265 drapeaux SVG de `country-flag-icons`
vers `public/flags/`. Le script tourne automatiquement au `npm install`
(y compris sur Vercel) ; le dossier n'est donc pas versionné.

Deux raisons de ne pas faire autrement :

- `react-phone-number-input/flags` embarquerait ~1 Mo de SVG dans le bundle ;
- le CDN par défaut de la librairie ferait partir une requête vers un tiers
  depuis le navigateur du visiteur.

Les drapeaux sont chargés en `loading="lazy"` : sur une liste de 250 pays,
seuls ceux visibles à l'écran sont téléchargés. Si un drapeau manque,
l'interface reste utilisable (le libellé du pays suffit).

### Coût

Ces deux fonctionnalités portent le JavaScript de la page publique de 165 à
245 Ko (métadonnées de numérotation internationale, pour l'essentiel). Pour
revenir en arrière sans perdre la validation, remplacer `PhoneField` par un
champ texte simple : le schéma Zod continue de valider les numéros.

---

## 4. Sécurité

| Mesure                       | Mise en œuvre                                                         |
| ---------------------------- | --------------------------------------------------------------------- |
| Authentification             | Supabase Auth (email + mot de passe)                                  |
| Habilitation                 | Table `admin_users` + fonction `is_admin()`                           |
| Row Level Security           | Activée sur `visitors` et `admin_users`                               |
| Accès public                 | `INSERT` uniquement, **et seulement si `consent_given = true`**       |
| Privilèges `anon`            | `GRANT INSERT` seul : aucune lecture possible, même sans RLS          |
| Accès administrateur         | `SELECT` / `UPDATE` / `DELETE` réservés aux membres de `admin_users`  |
| Lecture entre visiteurs      | Impossible : aucune policy `SELECT` pour le rôle `anon`               |
| Discrétion de l'espace admin | Aucun lien vers `/admin` sur les pages publiques                      |
| Validation                   | Zod côté client **et** revalidation intégrale côté serveur            |
| Contraintes base             | `CHECK` sur chaque champ + consentement obligatoire                   |
| Horodatages                  | Générés par des triggers PostgreSQL, jamais par le client             |
| Clé `service_role`           | Jamais exposée au navigateur (modules `server-only`)                  |
| Limitation de débit          | 10 soumissions / minute / IP sur le formulaire public                 |
| En-têtes HTTP                | `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |

Trois barrières successives protègent `/admin` : le middleware, la fonction
`requireAdmin()` côté serveur, et -autorité finale -les policies RLS
PostgreSQL.

---

## 5. Installation pas à pas

### 5.1 Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Nom : `anaq-visiteurs` · Région : la plus proche (par ex. `eu-west-3`)
3. Choisir un mot de passe de base de données et le conserver en lieu sûr

### 5.2 Créer la base et les tables

1. Dans le projet Supabase, ouvrir **SQL Editor** → **New query**
2. Copier-coller l'intégralité de `supabase/migrations/0001_init.sql`
3. Exécuter (**Run**)

Ce script crée :

- la table `visitors` (avec contraintes et index) ;
- la table `admin_users` ;
- la fonction `is_admin()` ;
- les triggers d'horodatage serveur.

### 5.3 Configurer les tables

Aucune action manuelle supplémentaire : la structure, les index et les
contraintes sont posés par la migration. Vérifier dans **Table Editor** que
`visitors` et `admin_users` apparaissent bien.

### 5.4 Configurer RLS

La migration `0001_init.sql` active déjà Row Level Security et crée les
policies. Vérification dans **Authentication → Policies** :

| Table         | Policy                    | Rôle                    | Opération                    |
| ------------- | ------------------------- | ----------------------- | ---------------------------- |
| `visitors`    | `visitors_public_insert`  | `anon`, `authenticated` | INSERT (consentement requis) |
| `visitors`    | `visitors_admin_select`   | `authenticated`         | SELECT (administrateurs)     |
| `visitors`    | `visitors_admin_update`   | `authenticated`         | UPDATE (administrateurs)     |
| `visitors`    | `visitors_admin_delete`   | `authenticated`         | DELETE (administrateurs)     |
| `admin_users` | `admin_users_select_self` | `authenticated`         | SELECT (sa propre fiche)     |

### 5.5 Créer le compte administrateur

1. **Authentication → Users → Add user**
2. Choisir **« Create new user »** -et non « Send invitation », qui ne demande
   qu'une adresse email et laisse l'utilisateur définir son mot de passe
   lui-même via un lien
3. Saisir l'email **et le mot de passe**, puis **cocher « Auto Confirm User »**
   (sans cela, la connexion échouera tant que l'email n'est pas confirmé)
4. Ouvrir **SQL Editor**, coller `supabase/migrations/0002_admin_account.sql`
5. Remplacer l'adresse par celle réellement créée, puis exécuter. Le `select`
   final doit afficher une ligne avec `is_active = true`

> Si vous supprimez puis recréez l'utilisateur, son `user_id` change : il faut
> **ré-exécuter la migration `0002`**. Elle est conçue pour être relancée sans
> risque. Sans cela, la connexion réussit mais l'accès est refusé.
>
> L'application ne propose pas encore de parcours « mot de passe oublié » :
> pour en changer, recréez l'utilisateur depuis le tableau de bord Supabase.

Un compte qui possède une session Supabase mais n'est pas présent dans
`admin_users` est **refusé** à la connexion : c'est le principe du moindre
privilège.

### 5.6 Configurer les variables d'environnement

Copier le modèle :

```bash
cp .env.example .env.local
```

Renseigner les valeurs depuis **Supabase → Project Settings → API** :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CONSENT_VERSION=1.0
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Clé publique** -Supabase propose deux formats, tous deux acceptés :
la clé `anon` historique (`eyJhbGciOi...`) et la nouvelle clé _publishable_
(`sb_publishable_...`). Les policies RLS s'appliquent identiquement.

**`SUPABASE_SERVICE_ROLE_KEY` est facultative en V1.** Aucune page ni route de
l'application ne l'utilise : le parcours visiteur et le parcours administrateur
passent tous deux par RLS. Laissez la ligne vide tant que vous n'ajoutez pas de
tâche d'administration serveur. Si vous en avez besoin plus tard :
_Project Settings → API Keys → « Create secret key »_, ou l'onglet
_« Legacy API keys »_ pour l'ancienne clé `service_role`.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` contourne entièrement RLS.
> Elle ne doit **jamais** être préfixée par `NEXT_PUBLIC_`, ni commitée,
> ni importée dans un composant client. Les modules qui la lisent sont marqués
> `server-only` : toute fuite vers le navigateur casse le build.

### 5.7 Lancement local

```bash
npm install
npm run dev
```

- Formulaire public : <http://localhost:3000>
- Espace administrateur : <http://localhost:3000/admin>

Autres commandes :

```bash
npm run build       # build de production
npm run typecheck   # vérification TypeScript
npm run lint        # ESLint
```

### 5.8 Déploiement Vercel

1. Pousser le dépôt sur GitHub / GitLab
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le dépôt
3. Framework détecté automatiquement : **Next.js** (aucun réglage à modifier)
4. **Environment Variables** -ajouter pour _Production_, _Preview_ et _Development_ :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` _(non exposée au navigateur)_
   - `NEXT_PUBLIC_CONSENT_VERSION`
   - `NEXT_PUBLIC_SITE_URL` → l'URL finale du projet
5. **Ignorer « Optional Integrations -> Supabase »** : cette intégration sert à
   créer ou rattacher un projet Supabase depuis Vercel et injecte ses propres
   variables. Le projet existe déjà et ses variables sont saisies à la main :
   l'ajouter ne ferait que créer des doublons.
6. **Deploy**
7. `NEXT_PUBLIC_SITE_URL` n'est pas connue avant le premier déploiement :
   déployez une première fois, puis renseignez l'URL obtenue et redéployez.
   À défaut, l'application se rabat sur `VERCEL_URL`.

**Région des fonctions.** La base Supabase est en `eu-west-3` (Paris) : le
fichier `vercel.json` fixe les fonctions serverless sur `cdg1` (Paris) pour
éviter un aller-retour transatlantique à chaque requête. Sans cela, Vercel
place les fonctions à Washington par défaut. Si votre base change de région,
ajustez `regions` dans `vercel.json` (`fra1` = Francfort, `iad1` = Washington).

> **Supabase → Authentication → URL Configuration** n'est *pas* nécessaire pour
> la V1 : la connexion se fait par mot de passe (`signInWithPassword`), sans
> lien email ni redirection OAuth. Il faudra y ajouter l'URL Vercel le jour où
> vous activerez la récupération de mot de passe ou les liens magiques.

---

## 6. Personnalisation ANAQ-Sup

Le logo officiel ANAQ-Sup est déjà intégré : `public/logo-anaqsup.png`
(copié depuis `src/assets/img/Logo_Anaq.png`). Il est utilisé à l'écran, en
favicon et dans les en-têtes des exports PDF.

| Élément                       | Où le modifier                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Logo (écran, favicon, PDF)    | remplacer `public/logo-anaqsup.png`                                                           |
| Proportions du logo           | `logoWidth` / `logoHeight` dans `src/lib/constants.ts`                                        |
| Titres, sous-titre, nom       | `src/lib/constants.ts` (objet `ORG`)                                                          |
| Texte du consentement         | `src/lib/constants.ts` (`CONSENT_TEXT`)                                                       |
| Version du consentement       | `NEXT_PUBLIC_CONSENT_VERSION`                                                                 |
| Suggestions pays / formations | `src/lib/constants.ts`                                                                        |
| Couleurs institutionnelles    | `src/app/globals.css`                                                                         |
| Couleur des boutons / PDF     | `--primary` (or) et `--navy` dans `globals.css`, `BRAND`/`GOLD` dans `src/lib/exports/pdf.ts` |
| Politique de confidentialité  | `src/app/politique-confidentialite/page.tsx`                                                  |

> À chaque modification du **texte** du consentement, incrémenter
> `NEXT_PUBLIC_CONSENT_VERSION`. La version est historisée avec chaque
> visiteur : les consentements passés restent rattachés au texte en vigueur au
> moment de leur recueil.

---

## 7. Exports

| Export    | Route                              | Contenu                                                                    |
| --------- | ---------------------------------- | -------------------------------------------------------------------------- |
| Excel     | `GET /api/admin/exports/excel`     | Feuille « Visiteurs » + feuille « Informations » (période, filtres, total) |
| PDF liste | `GET /api/admin/exports/pdf`       | Logo, titre, période, date de génération, tableau, total                   |
| PDF fiche | `GET /api/admin/visitors/[id]/pdf` | Fiche individuelle complète                                                |

Les filtres actifs de la liste (recherche, pays, formation, période, tri) sont
transmis dans l'URL et appliqués à l'export. Nommage des fichiers :
`visiteurs_anaqsup_AAAA-MM-JJ.xlsx` / `.pdf`.

Plafond de sécurité : `EXPORT_MAX_ROWS` (10 000 lignes) dans
`src/lib/constants.ts`.

---

## 8. Évolutions prévues

L'architecture a été pensée pour accueillir, sans réécriture :

- gestion des établissements habilités et des programmes accrédités ;
- recherche d'établissements et de programmes ;
- gestion des agents ANAQ-Sup, rôles et permissions fins
  (la colonne `admin_users.role` existe déjà) ;
- notes sur les visiteurs et suivi des demandes ;
- statistiques avancées (via des fonctions PostgreSQL dédiées) ;
- historique des actions et journaux d'audit ;
- notifications ;
- API externe.

---

## 9. Limites connues de la V1

- **Agrégats du tableau de bord** calculés sur les 5 000 enregistrements les
  plus récents (`STATS_SAMPLE`). Au-delà, remplacer par une fonction SQL
  d'agrégation côté PostgreSQL.
- **Limitation de débit** en mémoire : non partagée entre instances serverless.
  Brancher un stockage partagé (Vercel KV, Upstash) derrière
  `checkRateLimit()` pour une protection stricte.
- **Fuseau horaire** : dates affichées et exportées en UTC (heure de Dakar).
  Adapter `src/lib/utils.ts` pour un autre fuseau.
