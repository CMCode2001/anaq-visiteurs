-- =============================================================================
-- ANAQ-Sup -- Migration 0008 : specialite demandee par l'usager
-- =============================================================================
-- A executer dans Supabase > SQL Editor, apres la migration 0007.
-- Migration re-executable : `if not exists` / `drop ... if exists`.
--
-- Specialite de formation sur laquelle porte la sollicitation, pour suivre
-- les tendances des demandes. Colonne facultative : le registre importe ne
-- la mentionne pas ; elle se renseigne ensuite ligne par ligne.
-- =============================================================================

alter table public.archive_entries
  add column if not exists specialty varchar(200);

comment on column public.archive_entries.specialty is
  'Specialite de formation demandee par l''usager (facultative).';

alter table public.archive_entries
  drop constraint if exists archive_entries_specialty_not_blank;

alter table public.archive_entries
  add constraint archive_entries_specialty_not_blank check (
    specialty is null or length(btrim(specialty)) >= 2
  );

-- La specialite se corrige comme le nom et l'adresse ; la place de la ligne
-- dans le registre (annee, mois, numero) reste non modifiable.
grant update (full_name, email, specialty)
  on public.archive_entries to authenticated;

-- Verification
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'archive_entries'
  and column_name = 'specialty';
