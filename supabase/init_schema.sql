-- supabase/init_schema.sql
-- Run this in Supabase SQL Editor to create tables and policies

-- 1) Users table (not the built-in auth.users, but a profile table to store app metadata)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid, -- references auth.users
  name text,
  email text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_verified boolean default false
);

-- 2) Verification codes table
create table if not exists public.verification_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete cascade,
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 3) Trades table
create table if not exists public.trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete cascade,
  currency_pair text,
  direction text,
  entry_price numeric,
  exit_price numeric,
  accountBalance numeric,
  confluence_score integer,
  meta jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_trades_user_id on public.trades (user_id);
create index if not exists idx_ver_codes_user_id on public.verification_codes (user_id);

-- RLS and policies (enable depending on your setup)
-- NOTE: You should configure pg_settings and JWT auth. These policies are examples and assume using auth.jwt() claims.

-- Enable Row Level Security for trades (so the user can only access their trades)
alter table public.trades enable row level security;

-- Example policy
create policy "Users can manage own trades" on public.trades
for all
using (auth.uid() <> '' and auth.uid() = user_id::text) -- often auth.uid() returns a UUID string; map to your user mapping
with check (auth.uid() <> '' and auth.uid() = user_id::text);

-- For verification codes, allow insert by server/authenticated user and select/update delete by owner only
alter table public.verification_codes enable row level security;
create policy "User can manage own verification codes" on public.verification_codes
for all
using (auth.uid() <> '' and auth.uid() = user_id::text)
with check (auth.uid() <> '' and auth.uid() = user_id::text);

-- Users profile table policy: users can read and update their own profile
alter table public.users enable row level security;
create policy "User can manage own profile" on public.users
for all
using (auth.uid() <> '' and auth.uid() = id::text)
with check (auth.uid() <> '' and auth.uid() = id::text);

-- Additional setup notes:
-- 1) Create necessary roles and configure authentication provider (JWT from Supabase Auth)
-- 2) You probably want to have triggers to sync auth.users to public.users (on sign-up)
-- 3) For email verification and password handling, rely on Supabase Auth features for production
