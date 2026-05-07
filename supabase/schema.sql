-- FridgeChef - Supabase schema
-- Run this in the Supabase SQL Editor to set up the database

create table if not exists recipes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  ingredients text[] not null default '{}',
  instructions text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table recipes enable row level security;

-- Allow all operations (personal app, no auth needed)
create policy "Allow all operations" on recipes
  for all
  using (true)
  with check (true);
