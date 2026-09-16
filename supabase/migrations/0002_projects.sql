-- Milagro Universe: planner projects.
--
-- Run this once in the Supabase SQL editor, or via `npm run db:migrate`.
-- Idempotent, so re-running is safe.
--
-- One row per saved bathroom plan. The full planner payload (room, style,
-- fixtures, add-ons, generated 2D plan, estimate) is kept as a single JSONB
-- `data` blob — the planner owns that shape and it evolves independently of
-- the schema — while the columns that need indexing/listing are promoted out.

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid        not null references public.users (id) on delete cascade,
  name        text        not null default 'Untitled',
  status      text        not null default 'draft'
                check (status in ('draft', 'planned', 'shared')),
  -- The complete planner Project object (see lib/planner/types.ts).
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A user's project list, newest first.
create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists projects_owner_updated_idx
  on public.projects (owner_id, updated_at desc);

-- RLS on, no policies — every access is server-side via the service role key,
-- which bypasses RLS. Same posture as users/accounts: a leaked anon key opens
-- an empty door. (See 0001_users_and_accounts.sql for the full rationale.)
alter table public.projects enable row level security;
