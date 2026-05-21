-- Milestone 6: notes table + RLS.
-- Run this manually in the Supabase SQL editor after 0001_profiles.sql.
-- Reuses public.set_updated_at() defined in 0001.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);

-- GIN over tags so we can filter by tag membership efficiently if/when we
-- move tag filtering server-side.
create index if not exists notes_tags_gin_idx
  on public.notes using gin (tags);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

drop policy if exists "Notes are viewable by owner" on public.notes;
create policy "Notes are viewable by owner"
  on public.notes for select
  using (auth.uid() = user_id);

drop policy if exists "Notes are insertable by owner" on public.notes;
create policy "Notes are insertable by owner"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Notes are updatable by owner" on public.notes;
create policy "Notes are updatable by owner"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notes are deletable by owner" on public.notes;
create policy "Notes are deletable by owner"
  on public.notes for delete
  using (auth.uid() = user_id);
