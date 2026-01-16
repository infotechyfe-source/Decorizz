-- Add helpful/not helpful counters to reviews table
alter table public.reviews 
add column if not exists helpful_count integer default 0,
add column if not exists not_helpful_count integer default 0;

-- Function to increment vote counts safely
create or replace function vote_for_review(row_id uuid, vote_type text)
returns void
language plpgsql
security definer
as $$
begin
  if vote_type = 'up' then
    update public.reviews
    set helpful_count = helpful_count + 1
    where id = row_id;
  elsif vote_type = 'down' then
    update public.reviews
    set not_helpful_count = not_helpful_count + 1
    where id = row_id;
  end if;
end;
$$;
