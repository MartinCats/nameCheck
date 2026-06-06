alter table public.classrooms
  add column if not exists archived_at timestamptz;

create index if not exists classrooms_archived_at_idx
  on public.classrooms (archived_at);
