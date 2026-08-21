create policy "Users can read their own friend photos"
on storage.objects for select to authenticated
using (bucket_id = 'friend-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own friend photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'friend-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own friend photos"
on storage.objects for update to authenticated
using (bucket_id = 'friend-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own friend photos"
on storage.objects for delete to authenticated
using (bucket_id = 'friend-photos' and (storage.foldername(name))[1] = auth.uid()::text);