-- Milagro Universe: threaded project comments (M7 collaboration).
--
-- Run once via `npm run db:migrate` or the Supabase SQL editor. Idempotent.
--
-- A comment belongs to a project and an author; access is enforced in the
-- application (owner or project_members), the same way projects are. author_name
-- is denormalised so listing a thread needs no join to the users table.

create table if not exists public.project_comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects (id) on delete cascade,
  author_id   uuid        not null references public.users (id) on delete cascade,
  author_name text        not null default '',
  body        text        not null,
  created_at  timestamptz not null default now()
);

-- Threads are read by project, oldest first.
create index if not exists project_comments_project_idx
  on public.project_comments (project_id, created_at);

-- Same posture as the rest of the schema: RLS on, no policies. All access is
-- server-side via the service-role key; a leaked anon key reaches nothing.
alter table public.project_comments enable row level security;
