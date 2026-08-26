-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- Fixes: "Could not find the table 'public.trackers' in the schema cache"

create extension if not exists "pgcrypto";

-- ── 1. Create trackers table ──────────────────────────────────────────────
create table if not exists public.trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  substance text not null,
  label text,
  sober_since timestamptz not null,
  reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.trackers enable row level security;

drop policy if exists "Users manage their own trackers" on public.trackers;
create policy "Users manage their own trackers"
  on public.trackers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists trackers_user_substance_idx
  on public.trackers (user_id, substance)
  where substance <> 'custom';

create unique index if not exists trackers_user_custom_label_idx
  on public.trackers (user_id, lower(label))
  where substance = 'custom';

create index if not exists trackers_user_idx on public.trackers (user_id, created_at);

-- ── 2. Migrate old profiles → trackers (if you used the first version) ──
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    insert into public.trackers (user_id, substance, label, sober_since, reasons, created_at)
    select
      id,
      coalesce(nullif(addiction, ''), 'alcohol'),
      case when addiction = 'other' then 'Other' else null end,
      sober_since,
      reasons,
      created_at
    from public.profiles
    where not exists (
      select 1 from public.trackers where trackers.user_id = profiles.id
    );

    drop table public.profiles;
  end if;
end $$;

-- ── 3. Update entries table (if it exists) ────────────────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'entries'
  ) then
    alter table public.entries
      add column if not exists tracker_id uuid references public.trackers (id) on delete cascade;

    update public.entries e
    set tracker_id = t.id
    from (
      select distinct on (user_id) id, user_id
      from public.trackers
      order by user_id, created_at
    ) t
    where e.tracker_id is null and e.user_id = t.user_id;

    alter table public.entries drop constraint if exists entries_user_id_entry_date_key;

    delete from public.entries e1
    using public.entries e2
    where e1.tracker_id is not null
      and e1.tracker_id = e2.tracker_id
      and e1.entry_date = e2.entry_date
      and e1.id > e2.id;

    -- Remove orphan entries that couldn't be linked to a tracker
    delete from public.entries where tracker_id is null;

    alter table public.entries alter column tracker_id set not null;

    create unique index if not exists entries_tracker_date_idx
      on public.entries (tracker_id, entry_date);

    drop index if exists public.entries_user_date_idx;
    create index if not exists entries_tracker_date_sort_idx
      on public.entries (tracker_id, entry_date desc);
  else
    create table public.entries (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      tracker_id uuid not null references public.trackers (id) on delete cascade,
      entry_date date not null,
      pledged boolean not null default false,
      mood text,
      note text,
      created_at timestamptz not null default now(),
      unique (tracker_id, entry_date)
    );

    alter table public.entries enable row level security;

    drop policy if exists "Users manage their own entries" on public.entries;
    create policy "Users manage their own entries"
      on public.entries for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    create index if not exists entries_tracker_date_sort_idx
      on public.entries (tracker_id, entry_date desc);
  end if;
end $$;

-- ── 4. Refresh Supabase API schema cache ──────────────────────────────────
notify pgrst, 'reload schema';
