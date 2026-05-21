-- Milestone 6: appointments table + RLS.
-- Run this manually in the Supabase SQL editor after 0001_profiles.sql.
-- Reuses public.set_updated_at() defined in 0001.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_date timestamptz not null,
  provider_name text,
  provider_type text,
  location text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  prep_questions text,
  outcome_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_user_date_idx
  on public.appointments (user_id, appointment_date desc);

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "Appointments are viewable by owner" on public.appointments;
create policy "Appointments are viewable by owner"
  on public.appointments for select
  using (auth.uid() = user_id);

drop policy if exists "Appointments are insertable by owner" on public.appointments;
create policy "Appointments are insertable by owner"
  on public.appointments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Appointments are updatable by owner" on public.appointments;
create policy "Appointments are updatable by owner"
  on public.appointments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Appointments are deletable by owner" on public.appointments;
create policy "Appointments are deletable by owner"
  on public.appointments for delete
  using (auth.uid() = user_id);
