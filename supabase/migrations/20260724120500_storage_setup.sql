-- Setup Storage Buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

-- Policies for avatars
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');
create policy "Users can upload their own avatars." on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() = owner);
create policy "Users can update their own avatars." on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() = owner);
create policy "Users can delete their own avatars." on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid() = owner);

-- Policies for media
create policy "Media is publicly accessible." on storage.objects
  for select using (bucket_id = 'media');
create policy "Users can upload media." on storage.objects
  for insert with check (bucket_id = 'media' and auth.uid() = owner);
create policy "Users can update own media." on storage.objects
  for update using (bucket_id = 'media' and auth.uid() = owner);
create policy "Users can delete own media." on storage.objects
  for delete using (bucket_id = 'media' and auth.uid() = owner);
