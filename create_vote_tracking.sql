-- Create table to track user votes
create table if not exists public.review_votes (
  user_id uuid references auth.users not null,
  review_id uuid references public.reviews not null,
  vote_type text check (vote_type in ('up', 'down')),
  primary key (user_id, review_id)
);

-- Enable RLS
alter table public.review_votes enable row level security;

create policy "Users can view their own votes" on public.review_votes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own votes" on public.review_votes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own votes" on public.review_votes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own votes" on public.review_votes
  for delete using (auth.uid() = user_id);

-- Updated RPC function to handle toggling and switching
create or replace function vote_for_review(row_id uuid, vote_type text)
returns void
language plpgsql
security definer
as $$
declare
  existing_vote text;
begin
  -- Check existing vote for this user and review
  select rv.vote_type into existing_vote
  from public.review_votes rv
  where rv.review_id = row_id and rv.user_id = auth.uid();

  if existing_vote is null then
    -- Case 1: New vote (Insert and Increment)
    insert into public.review_votes (user_id, review_id, vote_type)
    values (auth.uid(), row_id, vote_type);

    if vote_type = 'up' then
      update public.reviews set helpful_count = helpful_count + 1 where id = row_id;
    else
      update public.reviews set not_helpful_count = not_helpful_count + 1 where id = row_id;
    end if;

  elsif existing_vote = vote_type then
    -- Case 2: Same vote exists (Toggle OFF: Delete and Decrement)
    delete from public.review_votes
    where review_id = row_id and user_id = auth.uid();

    if vote_type = 'up' then
      update public.reviews set helpful_count = helpful_count - 1 where id = row_id;
    else
      update public.reviews set not_helpful_count = not_helpful_count - 1 where id = row_id;
    end if;

  else
    -- Case 3: Different vote exists (Switch: Update table, Swap counters)
    update public.review_votes
    set vote_type = vote_type
    where review_id = row_id and user_id = auth.uid();

    if vote_type = 'up' then 
      -- Was down, now up
      update public.reviews set not_helpful_count = not_helpful_count - 1, helpful_count = helpful_count + 1 where id = row_id;
    else 
      -- Was up, now down
      update public.reviews set helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 where id = row_id;
    end if;
  end if;
end;
$$;
