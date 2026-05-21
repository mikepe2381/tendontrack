-- Milestone 3: daily_logs table + RLS.
-- Run this manually in the Supabase SQL editor after 0001_profiles.sql.
-- Reuses public.set_updated_at() defined in 0001.

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  pain_level int check (pain_level between 0 and 10),
  swelling_level int check (swelling_level between 0 and 10),
  sleep_hours numeric(3, 1) check (sleep_hours >= 0 and sleep_hours <= 24),
  sleep_quality int check (sleep_quality between 1 and 5),
  mood int check (mood between 1 and 5),
  mobility_status text check (
    mobility_status in (
      'nwb_cast', 'nwb_boot', 'pwb_boot', 'fwb_boot', 'fwb_shoe', 'unrestricted'
    )
  ),
  notes text,
  flagged_for_followup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_id_log_date_idx
  on public.daily_logs (user_id, log_date desc);

create index if not exists daily_logs_user_flagged_idx
  on public.daily_logs (user_id, log_date desc)
  where flagged_for_followup = true;

drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
create trigger daily_logs_set_updated_at
before update on public.daily_logs
for each row execute function public.set_updated_at();

alter table public.daily_logs enable row level security;

drop policy if exists "Daily logs are viewable by owner" on public.daily_logs;
create policy "Daily logs are viewable by owner"
  on public.daily_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Daily logs are insertable by owner" on public.daily_logs;
create policy "Daily logs are insertable by owner"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Daily logs are updatable by owner" on public.daily_logs;
create policy "Daily logs are updatable by owner"
  on public.daily_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Daily logs are deletable by owner" on public.daily_logs;
create policy "Daily logs are deletable by owner"
  on public.daily_logs for delete
  using (auth.uid() = user_id);
