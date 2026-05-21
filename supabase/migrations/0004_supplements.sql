-- Milestone 4: supplements + supplement_logs tables.
-- Run this manually in the Supabase SQL editor after 0001_profiles.sql.
-- Reuses public.set_updated_at() defined in 0001.

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  timing text check (
    timing in ('morning', 'midday', 'evening', 'bedtime', 'as_needed')
  ),
  notes text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplements_user_sort_idx
  on public.supplements (user_id, sort_order, created_at);

drop trigger if exists supplements_set_updated_at on public.supplements;
create trigger supplements_set_updated_at
before update on public.supplements
for each row execute function public.set_updated_at();

alter table public.supplements enable row level security;

drop policy if exists "Supplements are viewable by owner" on public.supplements;
create policy "Supplements are viewable by owner"
  on public.supplements for select
  using (auth.uid() = user_id);

drop policy if exists "Supplements are insertable by owner" on public.supplements;
create policy "Supplements are insertable by owner"
  on public.supplements for insert
  with check (auth.uid() = user_id);

drop policy if exists "Supplements are updatable by owner" on public.supplements;
create policy "Supplements are updatable by owner"
  on public.supplements for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Supplements are deletable by owner" on public.supplements;
create policy "Supplements are deletable by owner"
  on public.supplements for delete
  using (auth.uid() = user_id);


create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  log_date date not null,
  taken boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, supplement_id, log_date)
);

create index if not exists supplement_logs_user_date_idx
  on public.supplement_logs (user_id, log_date desc);

drop trigger if exists supplement_logs_set_updated_at on public.supplement_logs;
create trigger supplement_logs_set_updated_at
before update on public.supplement_logs
for each row execute function public.set_updated_at();

alter table public.supplement_logs enable row level security;

drop policy if exists "Supplement logs are viewable by owner" on public.supplement_logs;
create policy "Supplement logs are viewable by owner"
  on public.supplement_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Supplement logs are insertable by owner" on public.supplement_logs;
create policy "Supplement logs are insertable by owner"
  on public.supplement_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Supplement logs are updatable by owner" on public.supplement_logs;
create policy "Supplement logs are updatable by owner"
  on public.supplement_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Supplement logs are deletable by owner" on public.supplement_logs;
create policy "Supplement logs are deletable by owner"
  on public.supplement_logs for delete
  using (auth.uid() = user_id);
