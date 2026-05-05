-- Phase 2 lifecycle additions:
--  - distinguish onboarding tokens (purpose='claim') from upgrade magic links ('upgrade')
--  - track when a user was soft-locked (used by daily cron to schedule hard-delete at +30d)

alter table public.auth_tokens
  add column if not exists purpose text not null default 'claim'
  check (purpose in ('claim','upgrade'));

create index if not exists auth_tokens_pending
  on public.auth_tokens (purpose, expires_at)
  where claimed_at is null;

alter table public.users
  add column if not exists locked_at timestamptz;

create index if not exists users_locked_for_purge
  on public.users (locked_at)
  where locked_at is not null;
