-- =============================================================================
-- ANAQ-Sup -- Migration 0005 : archives du service aux usagers
-- =============================================================================
-- A executer dans Supabase > SQL Editor.
-- Migration re-executable : `if not exists` / `drop ... if exists` partout.
--
-- Le service aux usagers tient, mois par mois, un registre Word des
-- personnes qui l'ont sollicite par email (« Nom <adresse> »). Cette table
-- en recoit le contenu : une ligne par sollicitation, doublons compris.
--
-- Cette migration ne cree que la structure. Les donnees, personnelles,
-- ne sont jamais versionnees (le depot est public) : elles sont produites a
-- partir du registre par `scripts/archive-docx-to-sql.mjs`, puis executees
-- ici, dans le SQL Editor.
-- =============================================================================

create table if not exists public.archive_entries (
  id          uuid primary key default gen_random_uuid(),

  year        smallint     not null,
  month       smallint     not null,
  -- Rang de la ligne dans la liste du mois, tel que dans le registre.
  line_number integer      not null,

  -- Facultatif : certaines lignes du registre ne portent que l'adresse.
  full_name   varchar(200),
  email       varchar(255) not null,

  created_at  timestamptz  not null default now(),

  constraint archive_entries_year_range    check (year between 2000 and 2100),
  constraint archive_entries_month_range   check (month between 1 and 12),
  constraint archive_entries_line_positive check (line_number >= 1),
  constraint archive_entries_name_not_blank check (
    full_name is null or length(btrim(full_name)) >= 2
  ),
  constraint archive_entries_email_format  check (
    email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][a-z]{2,}$'
  ),
  -- Rend l'import re-executable : `on conflict do nothing`.
  constraint archive_entries_line_unique unique (year, month, line_number)
);

comment on table public.archive_entries is
  'Registre archive des sollicitations recues par le service aux usagers.';

create index if not exists archive_entries_email_idx
  on public.archive_entries (lower(email));

-- -----------------------------------------------------------------------------
-- Row Level Security : lecture reservee aux administrateurs.
-- Aucune ecriture depuis l'application : l'import passe par le SQL Editor,
-- dont le role contourne RLS.
-- -----------------------------------------------------------------------------
alter table public.archive_entries enable row level security;

drop policy if exists archive_entries_admin_select on public.archive_entries;

create policy archive_entries_admin_select
  on public.archive_entries
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

revoke all on public.archive_entries from anon, authenticated;
grant select on public.archive_entries to authenticated;

-- Verification
select count(*) as lignes_archivees from public.archive_entries;
