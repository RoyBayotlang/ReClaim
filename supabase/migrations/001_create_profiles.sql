-- =============================================================
-- ReClaim — Phase 3: Upgrade existing profiles table
-- =============================================================
-- Safe to run on a database that already has a profiles table
-- from Phase 1. Adds missing columns (email, updated_at).
-- =============================================================

-- 1. Add missing columns if they don't exist
alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. RLS policies (drop first to avoid "already exists" errors)

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Auto-update the updated_at timestamp on modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- 5. Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
