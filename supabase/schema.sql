-- Schema Supabase (Postgres) + RLS
-- Appliquer dans le SQL editor Supabase (dans l'ordre).

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Profiles (username)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3) Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists projects_user_id_name_unique on public.projects (user_id, name);
create unique index if not exists projects_user_id_name_normalized_unique
  on public.projects (user_id, lower(btrim(name)));
create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "projects_crud_own"
on public.projects
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 4) Pages (versions)
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  is_effective boolean not null default true,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists pages_project_id_idx on public.pages (project_id);
create index if not exists pages_project_effective_idx on public.pages (project_id, is_effective, created_at desc);

alter table public.pages enable row level security;

create policy "pages_select_own"
on public.pages for select
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = pages.project_id and p.user_id = auth.uid()
  )
);

create policy "pages_insert_own"
on public.pages for insert
to authenticated
with check (
  exists (
    select 1 from public.projects p
    where p.id = pages.project_id and p.user_id = auth.uid()
  )
);

create policy "pages_update_own"
on public.pages for update
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = pages.project_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = pages.project_id and p.user_id = auth.uid()
  )
);

create policy "pages_delete_own"
on public.pages for delete
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = pages.project_id and p.user_id = auth.uid()
  )
);

-- 5) Photos metadata (Storage path)
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null default 'photos',
  path text not null,
  alt text,
  descrip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photos_user_id_idx on public.photos (user_id);

alter table public.photos enable row level security;

create policy "photos_crud_own"
on public.photos
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 6) Sessions (registry révocable au niveau app)
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  ip inet,
  user_agent text,
  token_hash text not null
);

create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists user_sessions_token_hash_idx on public.user_sessions (token_hash);
create index if not exists user_sessions_revoked_idx on public.user_sessions (user_id, revoked_at);

alter table public.user_sessions enable row level security;

create policy "sessions_select_own"
on public.user_sessions for select
to authenticated
using (user_id = auth.uid());

create policy "sessions_insert_own"
on public.user_sessions for insert
to authenticated
with check (user_id = auth.uid());

create policy "sessions_update_own_revoke_only"
on public.user_sessions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

