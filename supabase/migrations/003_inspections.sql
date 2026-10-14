-- =============================================================
-- ReClaim — Phase 5: Inspections & Inspection Results Schema
-- =============================================================
-- Tables, constraints, indexes, and RLS policies for:
-- 1. inspections
-- 2. inspection_results
-- =============================================================

-- 1. Create or upgrade inspections table
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  inspected_by text,
  inspection_date timestamptz not null default now(),
  overall_condition text not null default 'UNASSESSED',
  general_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all required columns exist if table was previously created with minimal columns
alter table public.inspections add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.inspections add column if not exists inspected_by text;
alter table public.inspections add column if not exists inspection_date timestamptz not null default now();
alter table public.inspections add column if not exists overall_condition text not null default 'UNASSESSED';
alter table public.inspections add column if not exists general_notes text;
alter table public.inspections add column if not exists created_at timestamptz not null default now();
alter table public.inspections add column if not exists updated_at timestamptz not null default now();

-- Backfill user_id from owner_id if owner_id exists from legacy schema
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inspections' and column_name = 'owner_id') then
    update public.inspections set user_id = owner_id where user_id is null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inspections' and column_name = 'notes') then
    update public.inspections set general_notes = notes where general_notes is null and notes is not null;
  end if;
end $$;

-- Controlled overall_condition constraint
alter table public.inspections drop constraint if exists inspections_overall_condition_check;
alter table public.inspections add constraint inspections_overall_condition_check
  check (overall_condition in ('GOOD', 'FAIR', 'POOR', 'NON_FUNCTIONAL', 'UNASSESSED'));

-- 2. Create or upgrade inspection_results table
create table if not exists public.inspection_results (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  component_name text not null,
  component_type text not null default 'physical',
  condition text not null default 'NOT_TESTED',
  notes text,
  created_at timestamptz not null default now()
);

-- Ensure all required columns exist if table was previously created with minimal columns
alter table public.inspection_results add column if not exists component_name text;
alter table public.inspection_results add column if not exists component_type text not null default 'physical';
alter table public.inspection_results add column if not exists condition text not null default 'NOT_TESTED';
alter table public.inspection_results add column if not exists notes text;
alter table public.inspection_results add column if not exists created_at timestamptz not null default now();

-- Backfill from legacy columns if present
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inspection_results' and column_name = 'component') then
    update public.inspection_results set component_name = component where component_name is null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inspection_results' and column_name = 'result') then
    update public.inspection_results set condition = result where condition is null or condition = 'NOT_TESTED';
  end if;
end $$;

-- Controlled condition constraint
alter table public.inspection_results drop constraint if exists inspection_results_condition_check;
alter table public.inspection_results add constraint inspection_results_condition_check
  check (condition in ('GOOD', 'MINOR_ISSUE', 'DAMAGED', 'NOT_TESTED', 'NOT_APPLICABLE'));

-- 3. Indexes for query performance
create index if not exists idx_inspections_item_id on public.inspections(item_id);
create index if not exists idx_inspections_user_id on public.inspections(user_id);
create index if not exists idx_inspections_date on public.inspections(inspection_date desc);
create index if not exists idx_inspection_results_inspection_id on public.inspection_results(inspection_id);

-- 4. Enable Row Level Security
alter table public.inspections enable row level security;
alter table public.inspection_results enable row level security;

-- 5. RLS Policies for inspections
-- Ensures authenticated users can only view, create, update, and delete inspections
-- for items that belong to them (enforced via items.owner_id = auth.uid()).
drop policy if exists "Users can view own inspections" on public.inspections;
create policy "Users can view own inspections"
  on public.inspections for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = inspections.item_id
      and items.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can create inspections for own items" on public.inspections;
create policy "Users can create inspections for own items"
  on public.inspections for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = item_id
      and items.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update own inspections" on public.inspections;
create policy "Users can update own inspections"
  on public.inspections for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = inspections.item_id
      and items.owner_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = item_id
      and items.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own inspections" on public.inspections;
create policy "Users can delete own inspections"
  on public.inspections for delete
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = inspections.item_id
      and items.owner_id = auth.uid()
    )
  );

-- 6. RLS Policies for inspection_results
-- Ensures users can only access and modify checklist results if the inspection
-- belongs to them and the associated item belongs to them.
drop policy if exists "Users can view own inspection results" on public.inspection_results;
create policy "Users can view own inspection results"
  on public.inspection_results for select
  using (
    exists (
      select 1 from public.inspections
      join public.items on items.id = inspections.item_id
      where inspections.id = inspection_results.inspection_id
      and inspections.user_id = auth.uid()
      and items.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can create inspection results for own inspections" on public.inspection_results;
create policy "Users can create inspection results for own inspections"
  on public.inspection_results for insert
  with check (
    exists (
      select 1 from public.inspections
      join public.items on items.id = inspections.item_id
      where inspections.id = inspection_id
      and inspections.user_id = auth.uid()
      and items.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update own inspection results" on public.inspection_results;
create policy "Users can update own inspection results"
  on public.inspection_results for update
  using (
    exists (
      select 1 from public.inspections
      join public.items on items.id = inspections.item_id
      where inspections.id = inspection_results.inspection_id
      and inspections.user_id = auth.uid()
      and items.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.inspections
      join public.items on items.id = inspections.item_id
      where inspections.id = inspection_id
      and inspections.user_id = auth.uid()
      and items.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own inspection results" on public.inspection_results;
create policy "Users can delete own inspection results"
  on public.inspection_results for delete
  using (
    exists (
      select 1 from public.inspections
      join public.items on items.id = inspections.item_id
      where inspections.id = inspection_results.inspection_id
      and inspections.user_id = auth.uid()
      and items.owner_id = auth.uid()
    )
  );

-- 7. Trigger to keep updated_at in sync on inspections table
create or replace function public.touch_inspections_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists inspections_touch on public.inspections;
create trigger inspections_touch
  before update on public.inspections
  for each row
  execute function public.touch_inspections_updated_at();
