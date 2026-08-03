create table if not exists public.beetle_dashboards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.beetle_dashboards enable row level security;

create policy "Users can read their own beetle dashboard"
on public.beetle_dashboards
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own beetle dashboard"
on public.beetle_dashboards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own beetle dashboard"
on public.beetle_dashboards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own beetle dashboard"
on public.beetle_dashboards
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.beetle_dashboards to authenticated;
revoke all on public.beetle_dashboards from anon;
