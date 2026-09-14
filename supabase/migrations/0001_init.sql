-- =============================================================================
-- ANAQ-Sup -Fiche de présence des visiteurs
-- Migration 0001 : schéma initial, RLS et rôles administrateurs
-- À exécuter dans Supabase > SQL Editor (ou via `supabase db push`).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table des administrateurs
--    Lie un utilisateur Supabase Auth à un rôle applicatif.
--    (Prévu pour évoluer : rôles / permissions plus fins en V2.)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'admin'
             check (role in ('admin', 'super_admin')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Administrateurs ANAQ-Sup autorises a consulter et exporter les visiteurs.';

-- -----------------------------------------------------------------------------
-- 2. Fonction utilitaire : l'utilisateur courant est-il administrateur ?
--    SECURITY DEFINER pour pouvoir lire admin_users depuis une policy
--    sans provoquer de recursion RLS.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = uid
      and a.is_active
  );
$func$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Table des visiteurs
-- -----------------------------------------------------------------------------
create table if not exists public.visitors (
  id                  uuid primary key default gen_random_uuid(),

  first_name          varchar(100) not null,
  last_name           varchar(100) not null,
  country             varchar(100) not null,
  phone               varchar(30)  not null,
  email               varchar(255),
  formation_requested text         not null,

  consent_given       boolean      not null default false,
  consent_date        timestamptz,
  consent_version     varchar(20),

  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),

  -- Garde-fous applicatifs (defense en profondeur, en complement de Zod)
  constraint visitors_first_name_not_blank check (length(btrim(first_name)) >= 2),
  constraint visitors_last_name_not_blank  check (length(btrim(last_name))  >= 2),
  constraint visitors_country_not_blank    check (length(btrim(country))    >= 2),
  constraint visitors_phone_not_blank      check (length(btrim(phone))      >= 6),
  constraint visitors_formation_not_blank  check (length(btrim(formation_requested)) >= 2),
  constraint visitors_email_format         check (
    email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][a-z]{2,}$'
  ),
  -- Un enregistrement ne peut pas exister sans consentement explicite et date
  constraint visitors_consent_required     check (
    consent_given = true and consent_date is not null and consent_version is not null
  )
);

comment on table public.visitors is
  'Visiteurs accueillis par l''ANAQ-Sup (fiche de presence dematerialisee).';

create index if not exists visitors_created_at_idx on public.visitors (created_at desc);
create index if not exists visitors_country_idx    on public.visitors (country);
create index if not exists visitors_last_name_idx  on public.visitors (lower(last_name));
create index if not exists visitors_email_idx      on public.visitors (lower(email));

-- -----------------------------------------------------------------------------
-- 4. Timestamps serveur
--    created_at / updated_at / consent_date ne sont jamais pilotes par le client.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $func$
begin
  new.updated_at := now();
  return new;
end;
$func$;

drop trigger if exists visitors_set_updated_at on public.visitors;
create trigger visitors_set_updated_at
  before update on public.visitors
  for each row
  execute function public.set_updated_at();

create or replace function public.visitors_before_insert()
returns trigger
language plpgsql
as $func$
begin
  new.created_at   := now();
  new.updated_at   := now();
  new.consent_date := coalesce(new.consent_date, now());
  return new;
end;
$func$;

drop trigger if exists visitors_before_insert on public.visitors;
create trigger visitors_before_insert
  before insert on public.visitors
  for each row
  execute function public.visitors_before_insert();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security
--    Principe du moindre privilege :
--      * public (anon)   -> INSERT uniquement, et seulement avec consentement
--      * administrateurs -> SELECT / UPDATE / DELETE
--      * aucun visiteur ne peut lire les donnees d'un autre visiteur
-- -----------------------------------------------------------------------------
alter table public.visitors    enable row level security;
alter table public.admin_users enable row level security;

-- Migration re-executable : on repart d'un etat propre
drop policy if exists visitors_public_insert  on public.visitors;
drop policy if exists visitors_admin_select   on public.visitors;
drop policy if exists visitors_admin_update   on public.visitors;
drop policy if exists visitors_admin_delete   on public.visitors;
drop policy if exists admin_users_select_self on public.admin_users;

-- Depot d'une fiche de presence : ouvert, mais consentement obligatoire.
create policy visitors_public_insert
  on public.visitors
  for insert
  to anon, authenticated
  with check (consent_given = true);

-- Aucune policy SELECT pour anon => la lecture publique est impossible.
create policy visitors_admin_select
  on public.visitors
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy visitors_admin_update
  on public.visitors
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy visitors_admin_delete
  on public.visitors
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- Un administrateur peut lire sa propre fiche (nom affiche, role).
create policy admin_users_select_self
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 6. Privileges de table (moindre privilege, en amont de RLS)
-- -----------------------------------------------------------------------------
revoke all on public.visitors    from anon, authenticated;
revoke all on public.admin_users from anon, authenticated;

grant insert                         on public.visitors    to anon;
grant insert, select, update, delete on public.visitors    to authenticated;
grant select                         on public.admin_users to authenticated;
