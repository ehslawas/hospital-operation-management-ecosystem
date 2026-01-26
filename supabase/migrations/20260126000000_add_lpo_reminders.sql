create table if not exists pharmacy_lpo_reminders (
  id uuid default uuid_generate_v4() primary key,
  lpo_id uuid references pharmacy_lpo(id) on delete cascade not null,
  sent_at timestamptz default now() not null,
  sent_by uuid references auth.users(id),
  recipient_email text,
  recipient_name text,
  pdf_url text, -- Link to the stored PDF
  reminder_number integer default 1, -- 1st reminder, 2nd reminder, etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table pharmacy_lpo_reminders enable row level security;

create policy "Enable read access for authenticated users"
  on pharmacy_lpo_reminders for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users"
  on pharmacy_lpo_reminders for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users"
  on pharmacy_lpo_reminders for update
  to authenticated
  using (true);
