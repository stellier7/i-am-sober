-- Run this in the Supabase SQL editor for your project (Dashboard > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- One row per user: when their streak started and why.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  sober_since timestamptz not null,
  addiction text not null default 'alcohol',
  reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- One row per day: the daily pledge + optional journal note.
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  pledged boolean not null default false,
  mood text,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table entries enable row level security;

create policy "Users manage their own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists entries_user_date_idx on entries (user_id, entry_date desc);
