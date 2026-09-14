-- =============================================================================
-- ANAQ-Sup -- Diagnostic : pourquoi la connexion administrateur echoue-t-elle ?
-- =============================================================================
-- A executer dans Supabase > SQL Editor en remplacant l'adresse.
-- Aucune donnee n'est modifiee : ce script ne fait que lire.
-- =============================================================================

with cible as (select 'admin@anaqsup.sn'::text as email)   -- <-- REMPLACER

select
  u.email,
  u.created_at                              as compte_cree_le,
  u.email_confirmed_at                      as email_confirme_le,
  u.last_sign_in_at                         as derniere_connexion,
  (u.encrypted_password is not null
   and u.encrypted_password <> '')          as mot_de_passe_defini,
  a.user_id is not null                     as present_dans_admin_users,
  a.is_active                               as admin_actif,
  a.role                                    as role_applicatif
from cible c
left join auth.users   u on u.email = c.email
left join public.admin_users a on a.user_id = u.id;

-- Lecture du resultat :
--   aucune ligne / email vide  -> le compte n'existe pas (verifier l'adresse)
--   mot_de_passe_defini = false -> cree par « Send invitation », sans mot de
--                                  passe : le recreer via « Create new user »
--   email_confirme_le = null    -> email non confirme : la connexion est
--                                  refusee. Cocher « Auto Confirm User »
--   present_dans_admin_users = false -> la connexion reussira mais l'acces
--                                  sera refuse : rejouer la migration 0002
