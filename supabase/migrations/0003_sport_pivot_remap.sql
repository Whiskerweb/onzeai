-- Pivot multi-sport : remap des anciens coach_ids (5 ligues foot) vers les 4 nouveaux IDs sport.
-- Léo/Jack/Paco/Tony/Hans → tous regroupés sous 'foot' (Dembefric reste, étendu à tout le foot européen).
-- Les nouveaux coachs basket/tennis/ufc seront sélectionnés par les users via le magic link /upgrade.
--
-- À EXÉCUTER MANUELLEMENT après deploy du nouveau code, et idéalement d'abord sur staging.
-- Idempotent : safe à rejouer.

begin;

-- 1. Remap user_coaches (la M2M qui filtre le fan-out)
--
-- ⚠️ On NE peut pas faire un simple UPDATE sur la PK (user_id, coach_id) car :
--   (a) un user qui avait deux anciens IDs (leo + jack) ferait collision sur 'foot'
--   (b) un user qui s'est inscrit après le pivot a déjà 'foot' + encore un ancien id
-- → pattern : INSERT ('foot') ON CONFLICT DO NOTHING pour tous les concernés, puis DELETE des anciens.
insert into public.user_coaches (user_id, coach_id)
select distinct user_id, 'foot'
  from public.user_coaches
 where coach_id in ('leo', 'jack', 'paco', 'tony', 'hans')
on conflict (user_id, coach_id) do nothing;

delete from public.user_coaches
 where coach_id in ('leo', 'jack', 'paco', 'tony', 'hans');

-- 2. Remap users.active_coach_id (champ scalaire, pas de unique constraint → UPDATE direct OK)
update public.users
   set active_coach_id = 'foot'
 where active_coach_id in ('leo', 'jack', 'paco', 'tony', 'hans');

-- 3. Remap historique des picks (pour que les anciens picks restent attribués au bon coach)
update public.picks
   set coach_id = 'foot'
 where coach_id in ('leo', 'jack', 'paco', 'tony', 'hans');

-- 4. Remap historique des chats
update public.chat_messages
   set coach_id = 'foot'
 where coach_id in ('leo', 'jack', 'paco', 'tony', 'hans');

-- 5. Sanity check : tous les user_coaches doivent maintenant pointer vers un des 4 IDs valides
do $$
declare
  invalid_count int;
begin
  select count(*) into invalid_count
    from public.user_coaches
   where coach_id not in ('foot', 'basket', 'tennis', 'ufc');
  if invalid_count > 0 then
    raise exception 'Migration incomplete: % rows in user_coaches have an invalid coach_id', invalid_count;
  end if;
end $$;

commit;

-- Vérifications post-migration (à lancer manuellement) :
--   select coach_id, count(*) from public.user_coaches group by 1 order by 2 desc;
--   select coach_id, count(*) from public.picks group by 1 order by 2 desc;
--   select active_coach_id, count(*) from public.users group by 1 order by 2 desc;
