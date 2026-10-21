-- =============================================================================
-- ANAQ-Sup -- Migration 0006 : ajout de sollicitations depuis l'application
-- =============================================================================
-- A executer dans Supabase > SQL Editor, apres la migration 0005.
-- Migration re-executable : `create or replace` / `drop ... if exists`.
--
-- Le bouton « Ajouter » de la rubrique Archives n'envoie que le nom et
-- l'adresse. L'annee, le mois et le numero de ligne sont poses ici, par la
-- base : comme les horodatages des visiteurs, ils ne viennent jamais du
-- client.
-- =============================================================================

create or replace function public.archive_entries_before_insert()
returns trigger
language plpgsql
as $func$
declare
  today date := (now() at time zone 'UTC')::date;
begin
  -- Les lignes importees du registre arrivent deja numerotees : intactes.
  if new.line_number is not null then
    return new;
  end if;

  new.year  := extract(year from today);
  new.month := extract(month from today);

  -- Verrou par mois, libere en fin de transaction : deux ajouts simultanes
  -- ne peuvent pas obtenir le meme numero.
  perform pg_advisory_xact_lock(
    hashtext('archive_entries'),
    new.year * 100 + new.month
  );

  select coalesce(max(line_number), 0) + 1
    into new.line_number
    from public.archive_entries
   where year = new.year
     and month = new.month;

  return new;
end;
$func$;

drop trigger if exists archive_entries_before_insert on public.archive_entries;
create trigger archive_entries_before_insert
  before insert on public.archive_entries
  for each row
  execute function public.archive_entries_before_insert();

-- -----------------------------------------------------------------------------
-- Ecriture reservee aux administrateurs, comme la lecture.
-- -----------------------------------------------------------------------------
drop policy if exists archive_entries_admin_insert on public.archive_entries;

create policy archive_entries_admin_insert
  on public.archive_entries
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

grant insert on public.archive_entries to authenticated;

-- Verification
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'archive_entries'
order by policyname;
