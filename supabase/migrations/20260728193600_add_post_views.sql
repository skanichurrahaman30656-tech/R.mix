-- 6.5 Post Views Table
create table if not exists public.post_views (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (post_id, user_id)
);

alter table public.post_views enable row level security;
drop policy if exists "Post views are viewable by everyone." on post_views;
create policy "Post views are viewable by everyone." on post_views for select using (true);
drop policy if exists "Users can insert their own post views." on post_views;
create policy "Users can insert their own post views." on post_views for insert with check (auth.uid() = user_id);

create index if not exists idx_post_views_user_id on public.post_views(user_id);
create index if not exists idx_post_views_post_id on public.post_views(post_id);

drop trigger if exists update_post_views_updated_at on public.post_views;
create trigger update_post_views_updated_at before update on public.post_views for each row execute procedure update_updated_at_column();
