-- Run this in the Supabase SQL editor for your project (Dashboard > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- One row per substance the user tracks (alcohol, nicotine, weed, custom, etc.).
create table if not exists trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  substance text not null,
  label text,
  sober_since timestamptz not null,
  reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table trackers enable row level security;

create policy "Users manage their own trackers"
  on trackers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Prevent duplicate predefined substances; custom labels must be unique per user.
create unique index if not exists trackers_user_substance_idx
  on trackers (user_id, substance)
  where substance <> 'custom';

create unique index if not exists trackers_user_custom_label_idx
  on trackers (user_id, lower(label))
  where substance = 'custom';

create index if not exists trackers_user_idx on trackers (user_id, created_at);

-- One row per tracker per day: daily pledge + optional note.
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tracker_id uuid not null references trackers (id) on delete cascade,
  entry_date date not null,
  pledged boolean not null default false,
  mood text,
  note text,
  created_at timestamptz not null default now(),
  unique (tracker_id, entry_date)
);

alter table entries enable row level security;

create policy "Users manage their own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists entries_tracker_date_idx on entries (tracker_id, entry_date desc);
