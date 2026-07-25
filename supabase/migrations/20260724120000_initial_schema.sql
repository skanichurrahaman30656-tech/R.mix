-- Supabase Schema for R.mix
-- Run these in your Supabase SQL Editor

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  is_verified boolean default false,
  cover_url text
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Posts Table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text,
  type text default 'text' check (type in ('text', 'image', 'video', 'reel')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone." on posts
  for select using (true);

create policy "Users can insert their own posts." on posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own posts." on posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts." on posts
  for delete using (auth.uid() = user_id);


-- 3. Comments Table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone." on comments
  for select using (true);

create policy "Users can insert their own comments." on comments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own comments." on comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments." on comments
  for delete using (auth.uid() = user_id);


-- 4. Likes Table (for Posts)
create table public.likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone." on likes
  for select using (true);

create policy "Users can insert their own likes." on likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes." on likes
  for delete using (auth.uid() = user_id);


-- 5. Follows Table
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone." on follows
  for select using (true);

create policy "Users can insert their own follows." on follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can delete own follows." on follows
  for delete using (auth.uid() = follower_id);

-- 6. Stories Table
create table public.stories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_url text not null,
  type text default 'image' check (type in ('image', 'video', 'text', 'music')),
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours') not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stories enable row level security;

create policy "Stories are viewable by everyone." on stories
  for select using (true);

create policy "Users can insert their own stories." on stories
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own stories." on stories
  for delete using (auth.uid() = user_id);

-- 7. Messages Table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Messages are viewable by authenticated users." on messages
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own messages." on messages
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own messages." on messages
  for delete using (auth.uid() = user_id);

-- 8. Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'comment', 'follow', 'mention')),
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications." on notifications
  for select using (auth.uid() = user_id);

create policy "System can insert notifications." on notifications
  for insert with check (true);

create policy "Users can update their own notifications." on notifications
  for update using (auth.uid() = user_id);

-- 9. Saved Posts Table
create table if not exists public.saved_posts (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (post_id, user_id)
);

alter table public.saved_posts enable row level security;

create policy "Saved posts are viewable by user." on public.saved_posts
  for select using (auth.uid() = user_id);
create policy "Users can insert their own saved posts." on public.saved_posts
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved posts." on public.saved_posts
  for delete using (auth.uid() = user_id);

-- Create missing followers table (if distinct from follows)
create table if not exists public.followers (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

alter table public.followers enable row level security;

create policy "Followers are viewable by everyone." on public.followers
  for select using (true);
create policy "Users can insert their own followers." on public.followers
  for insert with check (auth.uid() = follower_id);
create policy "Users can delete own followers." on public.followers
  for delete using (auth.uid() = follower_id);

-- Indexes for performance
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_likes_post_id on public.likes(post_id);
create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_following_id on public.follows(following_id);
create index if not exists idx_followers_follower_id on public.followers(follower_id);
create index if not exists idx_followers_following_id on public.followers(following_id);
create index if not exists idx_saved_posts_user_id on public.saved_posts(user_id);
create index if not exists idx_saved_posts_post_id on public.saved_posts(post_id);
create index if not exists idx_stories_user_id on public.stories(user_id);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
