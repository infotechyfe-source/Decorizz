-- Create the reviews table if it doesn't exist
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_id uuid references auth.users not null,
  user_name text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policy to allow everyone to read reviews
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using ( true );

-- Policy to allow authenticated users to insert reviews
create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check ( auth.uid() = user_id );

-- Policy to allow users to update their own reviews (optional)
create policy "Users can update their own reviews"
  on public.reviews for update
  using ( auth.uid() = user_id );
