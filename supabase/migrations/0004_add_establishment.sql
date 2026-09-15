-- =============================================================================
-- ANAQ-Sup -- Migration 0004 : etablissement recherche par le visiteur
-- =============================================================================
-- A executer dans Supabase > SQL Editor.
-- Migration re-executable : `if not exists` partout.
--
-- Colonne facultative : un visiteur qui demande « quels etablissements sont
-- habilites pour cette filiere ? » n'a precisement pas d'etablissement a
-- nommer. La rendre obligatoire bloquerait ce cas, qui est le plus frequent.
-- =============================================================================

alter table public.visitors
  add column if not exists establishment varchar(200);

comment on column public.visitors.establishment is
  'Etablissement sur lequel porte la recherche du visiteur (facultatif).';

-- Garde-fou applicatif, en complement de Zod : soit absent, soit renseigne.
-- Une chaine vide ou faite d'espaces n'a pas de sens ici.
alter table public.visitors
  drop constraint if exists visitors_establishment_not_blank;

alter table public.visitors
  add constraint visitors_establishment_not_blank check (
    establishment is null or length(btrim(establishment)) >= 2
  );

-- Recherche par etablissement dans la liste administrateur.
create index if not exists visitors_establishment_idx
  on public.visitors (lower(establishment));

-- Verification
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'visitors'
  and column_name = 'establishment';
