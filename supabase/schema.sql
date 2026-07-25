-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  is_verified boolean default false,
  cover_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Posts Table
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text,
  type text default 'text' check (type in ('text', 'image', 'video', 'reel')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.posts enable row level security;
drop policy if exists "Posts are viewable by everyone." on posts;
create policy "Posts are viewable by everyone." on posts for select using (true);
drop policy if exists "Users can insert their own posts." on posts;
create policy "Users can insert their own posts." on posts for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own posts." on posts;
create policy "Users can update own posts." on posts for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own posts." on posts;
create policy "Users can delete own posts." on posts for delete using (auth.uid() = user_id);


-- 3. Comments Table
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.comments enable row level security;
drop policy if exists "Comments are viewable by everyone." on comments;
create policy "Comments are viewable by everyone." on comments for select using (true);
drop policy if exists "Users can insert their own comments." on comments;
create policy "Users can insert their own comments." on comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own comments." on comments;
create policy "Users can update own comments." on comments for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own comments." on comments;
create policy "Users can delete own comments." on comments for delete using (auth.uid() = user_id);


-- 4. Likes Table
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (post_id, user_id)
);

alter table public.likes enable row level security;
drop policy if exists "Likes are viewable by everyone." on likes;
create policy "Likes are viewable by everyone." on likes for select using (true);
drop policy if exists "Users can insert their own likes." on likes;
create policy "Users can insert their own likes." on likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own likes." on likes;
create policy "Users can delete own likes." on likes for delete using (auth.uid() = user_id);


-- 5. Followers Table
create table if not exists public.followers (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (follower_id, following_id)
);

alter table public.followers enable row level security;
drop policy if exists "Followers are viewable by everyone." on followers;
create policy "Followers are viewable by everyone." on followers for select using (true);
drop policy if exists "Users can insert their own followers." on followers;
create policy "Users can insert their own followers." on followers for insert with check (auth.uid() = follower_id);
drop policy if exists "Users can delete own followers." on followers;
create policy "Users can delete own followers." on followers for delete using (auth.uid() = follower_id);


-- 6. Saved Posts Table
create table if not exists public.saved_posts (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique (post_id, user_id)
);

alter table public.saved_posts enable row level security;
drop policy if exists "Saved posts are viewable by user." on saved_posts;
create policy "Saved posts are viewable by user." on saved_posts for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own saved posts." on saved_posts;
create policy "Users can insert their own saved posts." on saved_posts for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own saved posts." on saved_posts;
create policy "Users can delete own saved posts." on saved_posts for delete using (auth.uid() = user_id);


-- 7. Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'comment', 'follow', 'mention')),
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;
drop policy if exists "Users can view their own notifications." on notifications;
create policy "Users can view their own notifications." on notifications for select using (auth.uid() = user_id);
drop policy if exists "System can insert notifications." on notifications;
create policy "System can insert notifications." on notifications for insert with check (true);
drop policy if exists "Users can update their own notifications." on notifications;
create policy "Users can update their own notifications." on notifications for update using (auth.uid() = user_id);


-- 8. Messages Table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.messages enable row level security;
drop policy if exists "Users can view their messages." on messages;
create policy "Users can view their messages." on messages for select using (auth.uid() = user_id or auth.uid() = receiver_id);
drop policy if exists "Users can insert their own messages." on messages;
create policy "Users can insert their own messages." on messages for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own messages." on messages;
create policy "Users can update their own messages." on messages for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own messages." on messages;
create policy "Users can delete own messages." on messages for delete using (auth.uid() = user_id);


-- 9. Stories Table
create table if not exists public.stories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_url text not null,
  type text default 'image' check (type in ('image', 'video', 'text', 'music')),
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours') not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.stories enable row level security;
drop policy if exists "Stories are viewable by everyone." on stories;
create policy "Stories are viewable by everyone." on stories for select using (true);
drop policy if exists "Users can insert their own stories." on stories;
create policy "Users can insert their own stories." on stories for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own stories." on stories;
create policy "Users can update their own stories." on stories for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own stories." on stories;
create policy "Users can delete own stories." on stories for delete using (auth.uid() = user_id);


-- 10. Reels Table
create table if not exists public.reels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.reels enable row level security;
drop policy if exists "Reels are viewable by everyone." on reels;
create policy "Reels are viewable by everyone." on reels for select using (true);
drop policy if exists "Users can insert their own reels." on reels;
create policy "Users can insert their own reels." on reels for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own reels." on reels;
create policy "Users can update their own reels." on reels for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own reels." on reels;
create policy "Users can delete own reels." on reels for delete using (auth.uid() = user_id);


-- 11. Videos Table
create table if not exists public.videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  title text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.videos enable row level security;
drop policy if exists "Videos are viewable by everyone." on videos;
create policy "Videos are viewable by everyone." on videos for select using (true);
drop policy if exists "Users can insert their own videos." on videos;
create policy "Users can insert their own videos." on videos for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own videos." on videos;
create policy "Users can update their own videos." on videos for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own videos." on videos;
create policy "Users can delete own videos." on videos for delete using (auth.uid() = user_id);


-- Indexes for performance
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_likes_post_id on public.likes(post_id);
create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_followers_follower_id on public.followers(follower_id);
create index if not exists idx_followers_following_id on public.followers(following_id);
create index if not exists idx_saved_posts_user_id on public.saved_posts(user_id);
create index if not exists idx_saved_posts_post_id on public.saved_posts(post_id);
create index if not exists idx_stories_user_id on public.stories(user_id);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_reels_user_id on public.reels(user_id);
create index if not exists idx_videos_user_id on public.videos(user_id);

-- Setup Storage Buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

-- Policies for avatars
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Users can upload their own avatars." on storage.objects;
create policy "Users can upload their own avatars." on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() = owner);
drop policy if exists "Users can update their own avatars." on storage.objects;
create policy "Users can update their own avatars." on storage.objects for update using (bucket_id = 'avatars' and auth.uid() = owner);
drop policy if exists "Users can delete their own avatars." on storage.objects;
create policy "Users can delete their own avatars." on storage.objects for delete using (bucket_id = 'avatars' and auth.uid() = owner);

-- Policies for media
drop policy if exists "Media is publicly accessible." on storage.objects;
create policy "Media is publicly accessible." on storage.objects for select using (bucket_id = 'media');
drop policy if exists "Users can upload media." on storage.objects;
create policy "Users can upload media." on storage.objects for insert with check (bucket_id = 'media' and auth.uid() = owner);
drop policy if exists "Users can update own media." on storage.objects;
create policy "Users can update own media." on storage.objects for update using (bucket_id = 'media' and auth.uid() = owner);
drop policy if exists "Users can delete own media." on storage.objects;
create policy "Users can delete own media." on storage.objects for delete using (bucket_id = 'media' and auth.uid() = owner);

-- Triggers for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute procedure update_updated_at_column();

drop trigger if exists update_posts_updated_at on public.posts;
create trigger update_posts_updated_at before update on public.posts for each row execute procedure update_updated_at_column();

drop trigger if exists update_comments_updated_at on public.comments;
create trigger update_comments_updated_at before update on public.comments for each row execute procedure update_updated_at_column();

drop trigger if exists update_messages_updated_at on public.messages;
create trigger update_messages_updated_at before update on public.messages for each row execute procedure update_updated_at_column();

