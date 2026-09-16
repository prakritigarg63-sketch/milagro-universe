-- Milagro Universe: project sharing (two-sided co-edit).
--
-- Run once via `npm run db:migrate` or the Supabase SQL editor. Idempotent.
--
-- An owner can invite an expert/contractor to a project via a shareable link.
-- `project_members` records who (besides the owner) may open and co-edit a
-- project; `project_invites` are the revocable link tokens that grant membership.

create table if not exists public.project_members (
  project_id uuid        not null references public.projects (id) on delete cascade,
  user_id    uuid        not null references public.users (id) on delete cascade,
  role       text        not null default 'expert' check (role in ('owner', 'expert')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- "Projects shared with me" — the expert's list query.
create index if not exists project_members_user_idx on public.project_members (user_id);

create table if not exists public.project_invites (
  token      text        primary key,
  project_id uuid        not null references public.projects (id) on delete cascade,
  role       text        not null default 'expert' check (role in ('expert')),
  created_by uuid        not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked    boolean     not null default false
);

create index if not exists project_invites_project_idx on public.project_invites (project_id);

-- RLS on, no policies — service-role only, same posture as every other table.
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
