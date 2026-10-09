-- Run in the Supabase SQL editor.
create type item_status as enum ('unknown','inspection','needs_refurbishment','in_repair','quality_control','ready_to_sell','parts_only','disposed','sold');

create table profiles (id uuid primary key references auth.users on delete cascade, business_name text, full_name text, created_at timestamptz default now());
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  reference text not null, name text not null, category text, brand text, model text, serial_number text, description text,
  purchase_cost numeric(12,2) not null default 0, resale_value numeric(12,2) not null default 0, repair_estimate numeric(12,2) not null default 0,
  status item_status not null default 'unknown', image_url text, notes text,
  received_at date default current_date, created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (owner_id, reference));
create table inspections (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), item_id uuid not null references items on delete cascade, technician text, notes text, created_at timestamptz default now());
create table inspection_results (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), inspection_id uuid not null references inspections on delete cascade, section text, component text, result text check (result in ('good','minor_issue','damaged','not_tested','n/a')), notes text, photo_url text);
create table repair_tasks (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), item_id uuid not null references items on delete cascade, description text not null, required_action text, estimated_cost numeric(12,2) default 0, actual_cost numeric(12,2), technician text, status text default 'pending' check (status in ('pending','in_progress','completed','cancelled')), started_at date, completed_at date, notes text, created_at timestamptz default now());
create table quality_checks (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), item_id uuid not null references items on delete cascade, checklist jsonb default '{}', result text check (result in ('passed','failed','requires_rework')), notes text, created_at timestamptz default now());
create table status_history (id uuid primary key default gen_random_uuid(), owner_id uuid not null, item_id uuid not null references items on delete cascade, from_status item_status, to_status item_status not null, note text, created_at timestamptz default now());

-- Row Level Security: rows are only visible to their owner
do $$ declare t text; begin
  foreach t in array array['items','inspections','inspection_results','repair_tasks','quality_checks','status_history'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "owner access" on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop; end $$;
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles(id, full_name, business_name) values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'business_name'); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

-- Automatic status history
create function log_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into status_history(owner_id,item_id,to_status,note) values (new.owner_id,new.id,new.status,'Received');
  elsif new.status <> old.status then
    insert into status_history(owner_id,item_id,from_status,to_status) values (new.owner_id,new.id,old.status,new.status);
  end if; return new; end $$;
create trigger items_log after insert or update on items for each row execute function log_status();
create function touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger items_touch before update on items for each row execute function touch();

-- Demo data for the current user (called by the "Load demo data" button)
create function seed_demo() returns void language sql as $$
  insert into items (reference,name,category,brand,model,serial_number,purchase_cost,resale_value,repair_estimate,status,notes) values
  ('REF-1024','Lenovo ThinkPad T480','Laptop','Lenovo','T480','PF1A2B3C',7000,11500,1500,'unknown','Battery swell suspected'),
  ('REF-1025','Dell Latitude 5490','Laptop','Dell','5490','7XK2M91',6500,10500,2200,'inspection',null),
  ('REF-1026','iPhone 11','Phone','Apple','A2111','F2LDX9Q1',9000,14500,1800,'in_repair','Cracked screen'),
  ('REF-1027','Samsung Galaxy A52','Phone','Samsung','SM-A525F','R58N90XZ',5000,8000,900,'quality_control',null),
  ('REF-1028','Acer Aspire 5','Laptop','Acer','A515-54','NXHFDSP00',8500,10000,3500,'needs_refurbishment','Hinge broken'),
  ('REF-1029','Dell 24-inch Monitor','Monitor','Dell','P2419H','CN0KD7',2500,4200,300,'ready_to_sell',null);
$$;
