-- Create a new table for auditing oxygen stock adjustments
create table if not exists pharmacy_oxygen_stock_adjustments (
  id uuid default gen_random_uuid() primary key,
  hospital_id uuid references hospitals(id) not null,
  cylinder_id uuid references pharmacy_oxygen_cylinder_inventory(id) not null,
  adjusted_by uuid references auth.users(id) not null,
  old_status text,
  new_status text,
  reason text,
  remarks text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table pharmacy_oxygen_stock_adjustments enable row level security;

-- Policies
create policy "Users can view adjustments for their hospital"
  on pharmacy_oxygen_stock_adjustments for select
  using (hospital_id in (
    select hospital_id from user_hospital_mapping where user_id = auth.uid()
  ));

create policy "Users can insert adjustments for their hospital"
  on pharmacy_oxygen_stock_adjustments for insert
  with check (hospital_id in (
    select hospital_id from user_hospital_mapping where user_id = auth.uid()
  ));
