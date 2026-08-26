-- Run this ONCE if you already created the old single-substance schema.
-- Safe to run on a fresh project that used the new schema.sql (uses IF NOT EXISTS).

create extension if not exists "pgcrypto";

-- 1. Create trackers table
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

drop policy if exists "Users manage their own trackers" on trackers;
create policy "Users manage their own trackers"
  on trackers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists trackers_user_substance_idx
  on trackers (user_id, substance)
  where substance <> 'custom';

create unique index if not exists trackers_user_custom_label_idx
  on trackers (user_id, lower(label))
  where substance = 'custom';

create index if not exists trackers_user_idx on trackers (user_id, created_at);

-- 2. Migrate existing profiles → trackers (skip if profiles table doesn't exist)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    insert into trackers (user_id, substance, label, sober_since, reasons, created_at)
    select
      id,
      coalesce(nullif(addiction, ''), 'alcohol'),
      case when addiction = 'other' then 'Other' else null end,
      sober_since,
      reasons,
      created_at
    from profiles
    where not exists (select 1 from trackers where trackers.user_id = profiles.id);

    drop table profiles;
  end if;
end $$;

-- 3. Add tracker_id to entries (if missing) and backfill from first tracker per user
alter table entries add column if not exists tracker_id uuid references trackers (id) on delete cascade;

update entries e
set tracker_id = t.id
from (
  select distinct on (user_id) id, user_id
  from trackers
  order by user_id, created_at
) t
where e.tracker_id is null and e.user_id = t.user_id;

-- Drop old unique constraint if it exists, add tracker-scoped one
alter table entries drop constraint if exists entries_user_id_entry_date_key;

delete from entries e1
using entries e2
where e1.tracker_id = e2.tracker_id
  and e1.entry_date = e2.entry_date
  and e1.id > e2.id;

alter table entries alter column tracker_id set not null;

create unique index if not exists entries_tracker_date_idx
  on entries (tracker_id, entry_date);

drop index if exists entries_user_date_idx;
create index if not exists entries_tracker_date_sort_idx
  on entries (tracker_id, entry_date desc);
