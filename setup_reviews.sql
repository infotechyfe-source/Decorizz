-- Run this in your Supabase SQL Editor to set up the reviews table

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_id uuid references auth.users not null,
  user_name text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone"
  on reviews for select
  using ( true );

create policy "Users can insert their own reviews"
  on reviews for insert
  with check ( auth.uid() = user_id );

-- Optional: Policy for users to update their own reviews (if needed later)
-- create policy "Users can update their own reviews"
--   on reviews for update
--   using ( auth.uid() = user_id );
