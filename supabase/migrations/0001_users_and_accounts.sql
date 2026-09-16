-- Milagro Universe: users and authentication providers.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It is idempotent, so re-running it is safe.
--
-- Mirrors lib/db/types.ts. Providers are a separate table from users on
-- purpose: one Milagro Universe account can hold a password credential AND a Google
-- identity, and signing in either way must resolve to the same user id and the
-- same bathrooms.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text        not null,
  first_name  text        not null default '',
  last_name   text        not null default '',
  image       text,
  -- { bathroomName, intent, priorities }. Null until onboarding is finished,
  -- which is exactly what /auth/continue checks to decide where to send someone.
  onboarding  jsonb,
  created_at  timestamptz not null default now()
);

-- Addresses are normalised to lower case in the application, but the database
-- is the only place that can actually guarantee it: two concurrent sign-ups
-- with the same address must not both succeed.
create unique index if not exists users_email_key on public.users (lower(email));

create table if not exists public.accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  provider            text not null check (provider in ('google', 'credentials')),
  -- Google's `sub` claim, or the normalised email for a password credential.
  provider_account_id text not null,
  -- scrypt hash for 'credentials'. Never a plaintext password. Null for OAuth.
  password_hash       text,
  created_at          timestamptz not null default now()
);

-- The constraint that makes "do not create a duplicate user on every login"
-- a database guarantee rather than an application hope.
create unique index if not exists accounts_provider_account_key
  on public.accounts (provider, provider_account_id);

create index if not exists accounts_user_id_idx on public.accounts (user_id);

-- Row Level Security on, with no policies at all.
--
-- That is deliberate, not an oversight. Every read and write goes through the
-- server using the service role key, which bypasses RLS. Enabling RLS without
-- policies means the anon and authenticated keys — the ones that could ever
-- reach a browser — can read nothing and write nothing. If a key leaks, it
-- opens an empty door.
alter table public.users    enable row level security;
alter table public.accounts enable row level security;
