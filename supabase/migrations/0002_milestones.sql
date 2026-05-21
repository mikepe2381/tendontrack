-- Milestone 2: milestones table + RLS.
-- Run this manually in the Supabase SQL editor after 0001_profiles.sql.

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_key text not null,
  expected_week_min int,
  expected_week_max int,
  achieved_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, milestone_key)
);

create index if not exists milestones_user_id_idx on public.milestones (user_id);

drop trigger if exists milestones_set_updated_at on public.milestones;
create trigger milestones_set_updated_at
before update on public.milestones
for each row execute function public.set_updated_at();

alter table public.milestones enable row level security;

drop policy if exists "Milestones are viewable by owner" on public.milestones;
create policy "Milestones are viewable by owner"
  on public.milestones for select
  using (auth.uid() = user_id);

drop policy if exists "Milestones are insertable by owner" on public.milestones;
create policy "Milestones are insertable by owner"
  on public.milestones for insert
  with check (auth.uid() = user_id);

drop policy if exists "Milestones are updatable by owner" on public.milestones;
create policy "Milestones are updatable by owner"
  on public.milestones for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Milestones are deletable by owner" on public.milestones;
create policy "Milestones are deletable by owner"
  on public.milestones for delete
  using (auth.uid() = user_id);
