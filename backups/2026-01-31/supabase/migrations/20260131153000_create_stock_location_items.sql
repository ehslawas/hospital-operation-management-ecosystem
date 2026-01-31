-- Create a join table for Stock Locations and Unit Catalog Items
create table if not exists public.pharmacy_location_items (
  id uuid default gen_random_uuid() primary key,
  location_id uuid references public.pharmacy_stock_locations(id) on delete cascade not null,
  unit_catalog_item_id uuid references public.pharmacy_unit_catalog_items(id) on delete cascade not null,
  min_stock integer default 0,
  max_stock integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(location_id, unit_catalog_item_id)
);

-- Access Policies (RLS)
alter table public.pharmacy_location_items enable row level security;

create policy "Users can view location items for their hospital"
  on public.pharmacy_location_items for select
  using (
    exists (
      select 1 from public.pharmacy_stock_locations l
      where l.id = pharmacy_location_items.location_id
      and l.hospital_id::text = ((auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'hospital_id'::text)
    )
  );

create policy "Users can insert location items for their hospital"
  on public.pharmacy_location_items for insert
  with check (
    exists (
      select 1 from public.pharmacy_stock_locations l
      where l.id = pharmacy_location_items.location_id
      and l.hospital_id::text = ((auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'hospital_id'::text)
    )
  );

create policy "Users can update location items for their hospital"
  on public.pharmacy_location_items for update
  using (
    exists (
      select 1 from public.pharmacy_stock_locations l
      where l.id = pharmacy_location_items.location_id
      and l.hospital_id::text = ((auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'hospital_id'::text)
    )
  );

create policy "Users can delete location items for their hospital"
  on public.pharmacy_location_items for delete
  using (
    exists (
      select 1 from public.pharmacy_stock_locations l
      where l.id = pharmacy_location_items.location_id
      and l.hospital_id::text = ((auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'hospital_id'::text)
    )
  );

-- Trigger for updated_at
create trigger handle_updated_at before update on public.pharmacy_location_items
  for each row execute procedure moddatetime (updated_at);
