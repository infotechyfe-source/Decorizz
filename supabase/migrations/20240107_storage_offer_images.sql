-- Create a new public bucket for offer images
insert into storage.buckets (id, name, public)
values ('offer-images', 'offer-images', true)
on conflict (id) do nothing;

-- Policy: Public can view images
create policy "Public Access Offer Images"
  on storage.objects for select
  using ( bucket_id = 'offer-images' );

-- Policy: Authenticated users (admins) can upload images
create policy "Admin Upload Offer Images"
  on storage.objects for insert
  with check ( bucket_id = 'offer-images' and auth.role() = 'authenticated' );

-- Policy: Admin can update/delete images
create policy "Admin Update Offer Images"
  on storage.objects for update
  using ( bucket_id = 'offer-images' and auth.role() = 'authenticated' );

create policy "Admin Delete Offer Images"
  on storage.objects for delete
  using ( bucket_id = 'offer-images' and auth.role() = 'authenticated' );
