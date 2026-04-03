-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

create table if not exists waitlist (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table waitlist enable row level security;

-- Allow anonymous inserts (for the waitlist form)
create policy "Allow anonymous inserts" on waitlist
  for insert
  to anon
  with check (true);

-- Allow anonymous select (for duplicate checking)
create policy "Allow anonymous select" on waitlist
  for select
  to anon
  using (true);
