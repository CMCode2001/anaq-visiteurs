-- =============================================================================
-- ANAQ-Sup -- Migration 0007 : modification et suppression des archives
-- =============================================================================
-- A executer dans Supabase > SQL Editor, apres la migration 0006.
-- Migration re-executable : `drop ... if exists`.
--
-- Permet de corriger ou de retirer une ligne depuis la rubrique Archives.
--
-- Modification : seuls le nom et l'adresse sont modifiables. L'annee, le
-- mois et le numero situent la sollicitation dans le registre ; le privilege
-- UPDATE n'est accorde que sur les deux colonnes corrigeables.
--
-- Suppression : les numeros des autres lignes ne changent pas. Un trou dans
-- la numerotation vaut mieux qu'un registre dont les references bougent.
-- =============================================================================

drop policy if exists archive_entries_admin_update on public.archive_entries;
drop policy if exists archive_entries_admin_delete on public.archive_entries;

create policy archive_entries_admin_update
  on public.archive_entries
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy archive_entries_admin_delete
  on public.archive_entries
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

grant update (full_name, email) on public.archive_entries to authenticated;
grant delete on public.archive_entries to authenticated;

-- Verification
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'archive_entries'
order by policyname;
