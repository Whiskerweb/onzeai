-- Onze.ai initial schema
-- This is a dedicated Supabase project for Onze.ai, so tables live in `public` directly.

create extension if not exists pgcrypto;

-- Users (no Supabase Auth used in v1: Telegram is the source of identity)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  telegram_id bigint unique,
  telegram_username text,
  telegram_first_name text,
  plan text not null check (plan in ('solo','squad','all')),
  active_coach_id text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  linked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists users_telegram_id on public.users (telegram_id) where telegram_id is not null;
create index if not exists users_stripe_subscription on public.users (stripe_subscription_id) where stripe_subscription_id is not null;

-- One-time tokens to link a paying user to their Telegram account
create table if not exists public.auth_tokens (
  token text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists auth_tokens_unclaimed on public.auth_tokens (expires_at) where claimed_at is null;

-- Many-to-many: which coaches a user is subscribed to
create table if not exists public.user_coaches (
  user_id uuid not null references public.users(id) on delete cascade,
  coach_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, coach_id)
);
create index if not exists user_coaches_by_coach on public.user_coaches (coach_id);

-- Daily picks pushed by the local agent (or manual INSERT for now)
create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  coach_id text not null,
  fixture_id text,
  pick_text text not null,
  reasoning text,
  cote numeric(5,2),
  scheduled_for timestamptz default now(),
  broadcasted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists picks_coach_unbroadcasted on public.picks (coach_id) where broadcasted_at is null;

-- Track per-user delivery for dedup + observability
create table if not exists public.pick_deliveries (
  pick_id uuid not null references public.picks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  telegram_message_id bigint,
  error text,
  delivered_at timestamptz not null default now(),
  primary key (pick_id, user_id)
);

-- Chat history (also used for daily quota counting)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  coach_id text not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  tokens_used int,
  created_at timestamptz not null default now()
);
create index if not exists chat_user_role_day on public.chat_messages (user_id, role, created_at desc);

-- RLS: service-role-only access. Server-side code (Next.js routes + bot) uses the service key.
-- No anon/public access. We do not enable any policies on purpose.
alter table public.users enable row level security;
alter table public.auth_tokens enable row level security;
alter table public.user_coaches enable row level security;
alter table public.picks enable row level security;
alter table public.pick_deliveries enable row level security;
alter table public.chat_messages enable row level security;
