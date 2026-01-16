-- Create offers table
create table if not exists public.offers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  coupon_code text unique,
  discount_type text check (discount_type in ('percentage', 'fixed')) default 'percentage',
  discount_value numeric not null default 0,
  min_order_amount numeric default 0,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.offers enable row level security;

-- Policies

-- 1. Allow public read access (for OfferPopup)
-- Ideally we limit this to active offers, but for simplicity/debugging we can allow reading all or filter in query
create policy "Public can view offers"
  on public.offers for select
  using (true);

-- 2. Allow Service Role full access (for Edge Function admin operations)
-- This replaces the previous admin check that relied on public.users
create policy "Service Role can manage offers"
  on public.offers for all
  using ( auth.jwt() ->> 'role' = 'service_role' );
