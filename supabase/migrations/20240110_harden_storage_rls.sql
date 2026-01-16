-- Secure Storage Policies for 'offer-images' bucket

-- Drop existing insecure policies (if they match the names from previous migration)
drop policy if exists "Admin Upload Offer Images" on storage.objects;
drop policy if exists "Admin Update Offer Images" on storage.objects;
drop policy if exists "Admin Delete Offer Images" on storage.objects;

-- Re-create stricter policies checking for 'admin' role in user_metadata or service_role

-- 1. Upload: Admin Only
create policy "Admin Upload Offer Images"
  on storage.objects for insert
  with check (
    bucket_id = 'offer-images' and
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
      (auth.jwt() ->> 'role') = 'service_role'
    )
  );

-- 2. Update: Admin Only
create policy "Admin Update Offer Images"
  on storage.objects for update
  using (
    bucket_id = 'offer-images' and
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
      (auth.jwt() ->> 'role') = 'service_role'
    )
  );

-- 3. Delete: Admin Only
create policy "Admin Delete Offer Images"
  on storage.objects for delete
  using (
    bucket_id = 'offer-images' and
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
      (auth.jwt() ->> 'role') = 'service_role'
    )
  );
