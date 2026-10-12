-- =============================================================
-- ReClaim — Phase 4: Items & Status History Schema
-- =============================================================
-- Tables and RLS policies for Item Management module
-- =============================================================

-- 1. Status enum (create if not exists)
do $$ begin
  create type item_status as enum (
    'unknown',
    'inspection',
    'needs_refurbishment',
    'in_repair',
    'quality_control',
    'ready_to_sell',
    'parts_only',
    'disposed',
    'sold'
  );
exception
  when duplicate_object then null;
end $$;

-- 2. Items table
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  reference text not null,
  name text not null,
  category text,
  brand text,
  model text,
  serial_number text,
  description text,
  purchase_cost numeric(12,2) not null default 0,
  resale_value numeric(12,2) not null default 0,
  repair_estimate numeric(12,2) not null default 0,
  status item_status not null default 'unknown',
  image_url text,
  notes text,
  received_at date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (owner_id, reference)
);

-- 3. Status History table
create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  item_id uuid not null references public.items on delete cascade,
  from_status item_status,
  to_status item_status not null,
  note text,
  created_at timestamptz default now()
);

-- 4. Enable RLS
alter table public.items enable row level security;
alter table public.status_history enable row level security;

-- 5. RLS Policies
drop policy if exists "Users can manage own items" on public.items;
create policy "Users can manage own items"
  on public.items for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can view own status history" on public.status_history;
create policy "Users can view own status history"
  on public.status_history for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 6. Updated at trigger
create or replace function public.touch_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_touch on public.items;
create trigger items_touch
  before update on public.items
  for each row
  execute function public.touch_items_updated_at();

-- 7. Automatic status history logging trigger
create or replace function public.log_item_status()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history(owner_id, item_id, from_status, to_status, note)
    values (new.owner_id, new.id, null, new.status, coalesce(new.notes, 'Item received into inventory'));
  elsif new.status <> old.status then
    insert into public.status_history(owner_id, item_id, from_status, to_status, note)
    values (new.owner_id, new.id, old.status, new.status, coalesce(new.notes, 'Status changed to ' || new.status::text));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists items_log on public.items;
create trigger items_log
  after insert or update on public.items
  for each row
  execute function public.log_item_status();
