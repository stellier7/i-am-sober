-- Run this ONCE in Supabase → SQL Editor if you already have the trackers table.
-- Adds display order so you can put weed first, alcohol second, etc.

alter table public.trackers
  add column if not exists sort_order integer not null default 0;

-- Backfill from creation order (oldest = 0, next = 1, …)
with ordered as (
  select
    id,
    row_number() over (partition by user_id order by created_at asc) - 1 as new_order
  from public.trackers
)
update public.trackers t
set sort_order = ordered.new_order
from ordered
where t.id = ordered.id;

create index if not exists trackers_user_sort_idx
  on public.trackers (user_id, sort_order);

notify pgrst, 'reload schema';
