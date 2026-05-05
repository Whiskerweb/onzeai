-- Knowledge base multi-sport : tables alimentées par les agents (foot/basket/tennis/ufc)
-- pour stocker fixtures, odds, stats, news, injuries, embeddings, et trace des décisions.
--
-- Pré-requis : 0003_sport_pivot_remap.sql doit être appliqué (les coach_ids 'foot'|'basket'|'tennis'|'ufc'
-- sont supposés exister dans user_coaches/picks).
--
-- À EXÉCUTER MANUELLEMENT (Supabase dashboard SQL Editor ou `supabase db push`).
-- Idempotent : safe à rejouer.

begin;

-- pgvector pour les embeddings news (future RAG côté chat)
create extension if not exists vector;

-- ─────────────────────────────────────────────────────────────────
-- 1. Référentiels
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.sports (
  id text primary key,                              -- 'foot' | 'basket' | 'tennis' | 'ufc'
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  code text not null,                               -- 'l1' | 'pl' | 'liga' | 'serie_a' | 'bundesliga' | 'cl' | 'el'
                                                    -- 'nba' | 'euroleague' | 'atp' | 'wta' | 'ufc'
  name text not null,
  ext_ids jsonb not null default '{}'::jsonb,       -- {"fbref":"Ligue-1","odds_api":"soccer_france_ligue_one"}
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (sport_id, code)
);
create index if not exists idx_leagues_sport on public.leagues (sport_id) where active = true;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete set null,
  name text not null,
  short_name text,
  ext_ids jsonb not null default '{}'::jsonb,       -- {"fbref":"Paris-S-G","odds_api":"Paris Saint Germain","footballdata":"PSG"}
  created_at timestamptz not null default now(),
  unique (sport_id, league_id, name)
);
create index if not exists idx_teams_sport on public.teams (sport_id);
create index if not exists idx_teams_ext_ids_gin on public.teams using gin (ext_ids);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  position text,
  ext_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (sport_id, team_id, name)
);
create index if not exists idx_players_sport on public.players (sport_id);
create index if not exists idx_players_team on public.players (team_id);

-- ─────────────────────────────────────────────────────────────────
-- 2. Données match
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete set null,
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  -- Pour tennis/ufc le concept "home/away" n'a pas de sens — on remappe : home=player_a, away=player_b.
  -- player_a_id / player_b_id sont des aliases logiques côté code.
  kickoff timestamptz not null,
  status text not null default 'scheduled',         -- scheduled|live|finished|postponed|cancelled
  score jsonb,                                       -- {"home":2,"away":1} ou {"a_sets":[6,4,6],"b_sets":[3,6,4]} pour tennis
  ext_ids jsonb not null default '{}'::jsonb,       -- {"odds_api":"abc123","footballdata":98765}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fixtures_upcoming on public.fixtures (sport_id, kickoff)
  where status = 'scheduled';
create index if not exists idx_fixtures_ext_ids_gin on public.fixtures using gin (ext_ids);

create table if not exists public.odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  book text not null,                               -- 'pinnacle' | 'betfair' | 'oddsapi_avg' | 'winamax' | etc.
  market text not null,                             -- '1x2' | 'ah' | 'ou' | 'btts' | 'ml' | 'spread' | 'method' | 'total'
  side text not null,                               -- 'home'|'away'|'draw'|'over'|'under'|'fighter_a'|'fighter_b'|'ko'|'sub'|'dec'|...
  line numeric(6,2),                                -- handicap / total ; null pour 1X2/ML/method
  price numeric(7,3) not null check (price > 1),    -- cote décimale
  taken_at timestamptz not null default now()
);
create index if not exists idx_odds_fixture_market on public.odds_snapshots (fixture_id, market, taken_at desc);
create index if not exists idx_odds_book on public.odds_snapshots (book, taken_at desc);

-- ─────────────────────────────────────────────────────────────────
-- 3. Statistiques (team + player)
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.stats_team (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  fixture_id uuid references public.fixtures(id) on delete set null,
  period text not null,                             -- 'match'|'last5'|'last10'|'season'|'h2h'|'home_season'|'away_season'
  metric text not null,                             -- 'xg'|'xga'|'xpts'|'ppg'|'ortg'|'drtg'|'pace'|'elo'|'corners'|'cards'|...
  value numeric not null,
  computed_at timestamptz not null default now()
);
create index if not exists idx_stats_team_lookup on public.stats_team (team_id, period, metric, computed_at desc);
create index if not exists idx_stats_team_fixture on public.stats_team (fixture_id) where fixture_id is not null;

create table if not exists public.stats_player (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  fixture_id uuid references public.fixtures(id) on delete set null,
  period text not null,
  metric text not null,                             -- 'pts'|'reb'|'ast'|'pra'|'1st_serve_pct'|'ace_rate'|'ko_rate'|...
  value numeric not null,
  computed_at timestamptz not null default now()
);
create index if not exists idx_stats_player_lookup on public.stats_player (player_id, period, metric, computed_at desc);

-- ─────────────────────────────────────────────────────────────────
-- 4. Texte (news + injuries) avec embeddings pour future RAG chat
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  source text not null,                             -- 'lequipe'|'bbc'|'espn'|'sherdog'|'reddit_mma'|'rss_*'|...
  url text,
  title text not null,
  summary text,
  published_at timestamptz,
  embedding vector(1536),                            -- text-embedding-3-small ; null si embed pas encore calculé
  created_at timestamptz not null default now(),
  unique (sport_id, source, url)
);
create index if not exists idx_news_recent on public.news_items (sport_id, published_at desc nulls last);
create index if not exists idx_news_team on public.news_items (team_id, published_at desc) where team_id is not null;
create index if not exists idx_news_player on public.news_items (player_id, published_at desc) where player_id is not null;
-- Index ANN pour la future RAG (cosine). HNSW à activer plus tard si pgvector >= 0.5
-- create index if not exists idx_news_embedding on public.news_items using hnsw (embedding vector_cosine_ops);

create table if not exists public.injuries (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete cascade,
  status text not null,                             -- 'out'|'doubtful'|'questionable'|'fit'|'returning'
  details text,
  expected_return timestamptz,
  source text,
  reported_at timestamptz not null default now()
);
create index if not exists idx_injuries_active on public.injuries (player_id, reported_at desc);

-- ─────────────────────────────────────────────────────────────────
-- 5. Trace des runs et décisions agents
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  kind text not null check (kind in ('ingest','analyze')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','success','error')),
  error text,
  metrics jsonb not null default '{}'::jsonb        -- {"fixtures_processed":12,"picks_pushed":2,"api_calls":47}
);
create index if not exists idx_agent_runs_recent on public.agent_runs (sport_id, kind, started_at desc);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  model text not null,                              -- 'claude-haiku-4-5' | 'claude-sonnet-4-5' | ...
  input_tokens int,
  output_tokens int,
  market text,
  side text,
  line numeric(6,2),
  recommended_price numeric(7,3),
  p_model numeric(5,4),
  p_fair numeric(5,4),
  edge_pct numeric(5,2),
  expected_clv_pp numeric(5,2),
  decision text not null check (decision in ('push','pass','watch')),
  reasoning text,
  pick_id uuid references public.picks(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_analyses_recent on public.analyses (sport_id, created_at desc);
create index if not exists idx_analyses_fixture on public.analyses (fixture_id, created_at desc);
create index if not exists idx_analyses_pick on public.analyses (pick_id) where pick_id is not null;

-- ─────────────────────────────────────────────────────────────────
-- 6. RLS (pattern existant : enabled, no policies → service-role-only)
-- ─────────────────────────────────────────────────────────────────

alter table public.sports          enable row level security;
alter table public.leagues         enable row level security;
alter table public.teams           enable row level security;
alter table public.players         enable row level security;
alter table public.fixtures        enable row level security;
alter table public.odds_snapshots  enable row level security;
alter table public.stats_team      enable row level security;
alter table public.stats_player    enable row level security;
alter table public.news_items      enable row level security;
alter table public.injuries        enable row level security;
alter table public.agent_runs      enable row level security;
alter table public.analyses        enable row level security;

-- ─────────────────────────────────────────────────────────────────
-- 7. Seed des 4 sports
-- ─────────────────────────────────────────────────────────────────

insert into public.sports (id, name) values
  ('foot',   'Football'),
  ('basket', 'Basketball'),
  ('tennis', 'Tennis'),
  ('ufc',    'MMA / UFC')
on conflict (id) do nothing;

commit;

-- Vérifications post-migration (à lancer manuellement) :
--   select extname from pg_extension where extname = 'vector';
--   select id, name, active from public.sports;
--   select table_name from information_schema.tables
--     where table_schema='public' and table_name in
--     ('sports','leagues','teams','players','fixtures','odds_snapshots',
--      'stats_team','stats_player','news_items','injuries','agent_runs','analyses')
--     order by 1;
