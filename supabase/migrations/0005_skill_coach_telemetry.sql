-- Telemetry pour skills coach : DRY_RUN flag, CLV mesuré, vue agrégée perf,
-- table backtest A/B variants. Pré-requis : 0004_knowledge_base.sql appliqué.
--
-- À EXÉCUTER MANUELLEMENT (Supabase dashboard SQL Editor ou `supabase db push`).
-- Idempotent : safe à rejouer.

begin;

-- ─────────────────────────────────────────────────────────────────
-- 1. Colonnes telemetry sur public.analyses
-- ─────────────────────────────────────────────────────────────────

alter table public.analyses
  add column if not exists dry_run        boolean not null default false,
  add column if not exists closing_price  numeric(7,3),     -- ferme close-line snapshotée au kickoff
  add column if not exists closing_book   text,             -- book de référence ('pinnacle' | 'oddsapi_avg' | ...)
  add column if not exists clv_pp         numeric(6,3),     -- CLV en points de pourcentage : (1/recommended − 1/closing) × 100
  add column if not exists result         text check (result in ('win','loss','push','void')),
  add column if not exists settled_at     timestamptz,
  add column if not exists coach_voice_compliant boolean,   -- self-check LLM
  add column if not exists sanity_check_passed   boolean;   -- self-check LLM

create index if not exists idx_analyses_clv
  on public.analyses (sport_id, settled_at desc)
  where clv_pp is not null;

create index if not exists idx_analyses_dry_run
  on public.analyses (sport_id, created_at desc)
  where dry_run = true;

-- ─────────────────────────────────────────────────────────────────
-- 2. Table backtest_runs : A/B variants pour skill rollout
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.backtest_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,                                     -- groupe les rows d'un même backtest
  sport_id text not null references public.sports(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  variant text not null check (variant in ('A','B')),       -- A = sans skill coach, B = avec
  model text not null,
  input_tokens int,
  output_tokens int,
  cache_creation_tokens int,
  cache_read_tokens int,
  decision text not null check (decision in ('push','pass','watch')),
  market text,
  side text,
  line numeric(6,2),
  recommended_price numeric(7,3),
  p_model numeric(5,4),
  p_fair numeric(5,4),
  edge_pct numeric(5,2),
  simulated_clv_pp numeric(6,3),                            -- vs closing_line de la fixture
  reasoning text,
  created_at timestamptz not null default now()
);
create index if not exists idx_backtest_runs_run on public.backtest_runs (run_id);
create index if not exists idx_backtest_runs_sport on public.backtest_runs (sport_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────
-- 3. Vue agent_performance : agrégat hebdo par sport
-- ─────────────────────────────────────────────────────────────────

create or replace view public.agent_performance as
select
  a.sport_id,
  date_trunc('week', a.created_at) as week,
  count(*) filter (where a.decision = 'push') as pushes,
  count(*) filter (where a.decision = 'pass')  as passes,
  count(*) filter (where a.decision = 'watch') as watches,
  round(avg(a.edge_pct) filter (where a.decision = 'push')::numeric, 2) as avg_edge,
  round(avg(a.clv_pp) filter (where a.decision = 'push' and a.clv_pp is not null)::numeric, 3) as avg_clv,
  round(
    (avg(case
      when a.result = 'win'  then (a.recommended_price - 1)
      when a.result = 'loss' then -1
      when a.result = 'push' then 0
      else null
     end) filter (where a.decision = 'push' and a.result in ('win','loss','push')))::numeric, 4
  ) as roi_unit,
  round(
    (count(*) filter (where a.decision = 'push' and a.result = 'win')::numeric
      / nullif(count(*) filter (where a.decision = 'push' and a.result in ('win','loss')), 0)
    )::numeric, 4
  ) as hit_rate,
  count(*) filter (where a.decision = 'push' and a.dry_run = true) as dry_pushes,
  count(*) filter (where a.decision = 'push' and a.dry_run = false) as live_pushes
from public.analyses a
group by a.sport_id, date_trunc('week', a.created_at);

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS sur backtest_runs (pattern existant : service-role-only)
-- ─────────────────────────────────────────────────────────────────

alter table public.backtest_runs enable row level security;

commit;
