-- Fiche d'analyse longue (markdown) pour pages publiques /picks/[id].
-- Stockée par-pick dans analyses.analysis_card. Accessible publiquement via
-- une vue dédiée (pas d'auth requise pour lire la fiche d'un pick déjà poussé).
--
-- Pré-requis : 0005_skill_coach_telemetry.sql appliqué.
-- Idempotent : safe à rejouer.

begin;

-- ─────────────────────────────────────────────────────────────────
-- 1. Colonne analysis_card sur public.analyses
-- ─────────────────────────────────────────────────────────────────

alter table public.analyses
  add column if not exists analysis_card text;       -- markdown 10 sections football-pronostics

-- ─────────────────────────────────────────────────────────────────
-- 2. Vue publique : 1 fiche par pick poussé
-- ─────────────────────────────────────────────────────────────────
-- La fiche est rendue par /picks/[id] côté Next.js. La vue expose seulement
-- les champs nécessaires (pas de leak de p_model interne / agent_run_id / etc.).

create or replace view public.public_picks as
select
  p.id              as pick_id,
  p.coach_id,
  p.pick_text,
  p.cote,
  p.reasoning       as pick_reasoning,
  p.fixture_id,
  p.created_at,
  a.analysis_card,
  a.market,
  a.side,
  a.line,
  a.recommended_price,
  a.edge_pct,
  fx.kickoff,
  fx.status         as fixture_status,
  l.code            as league_code,
  l.name            as league_name,
  ht.name           as home_team_name,
  at.name           as away_team_name,
  s.id              as sport_id,
  s.name            as sport_name
from public.picks p
left join public.analyses a on a.pick_id = p.id
-- picks.fixture_id est text (legacy), fixtures.id est uuid → cast safe via try-uuid.
left join public.fixtures fx
  on fx.id::text = p.fixture_id
left join public.leagues  l  on l.id = fx.league_id
left join public.teams    ht on ht.id = fx.home_team_id
left join public.teams    at on at.id = fx.away_team_id
left join public.sports   s  on s.id = fx.sport_id;

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS : accessible en lecture anonyme (pages publiques /picks/[id])
-- ─────────────────────────────────────────────────────────────────
-- Pattern : la vue tape sur des tables RLS service-role-only, donc accessible
-- uniquement via service-role côté serveur Next.js. La page publique appelle
-- /api/picks/[id] qui utilise le client serveur avec service-role-key.
-- Pas de policy à ajouter — on contrôle l'accès au niveau de l'API route.

commit;
