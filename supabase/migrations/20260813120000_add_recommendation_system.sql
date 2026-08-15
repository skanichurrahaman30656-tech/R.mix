-- Migration to support the Smart Viral Recommendation System with fine-grained video performance and personalized discovery.
begin;

  -- 1. Add category column to posts table to organize content by topic
  alter table public.posts add column if not exists category text default 'General';

  -- 2. Create the unified recommendation_events table to track detailed performance signals
  create table if not exists public.recommendation_events (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    post_id uuid references public.posts(id) on delete cascade not null,
    event_type text not null, -- 'impression', 'video_start', 'watch_time', 'video_completion', 'replay', 'like', 'comment', 'share', 'save', 'follow_after_view', 'profile_visit_after_view', 'hide', 'report', 'skip', 'video_exit'
    watch_duration numeric default 0.0 not null,
    percentage_watched numeric default 0.0 not null,
    session_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- 3. Create user_interest_signals table to map user engagement per category/topic
  create table if not exists public.user_interest_signals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    category text not null,
    score numeric default 0.0 not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, category)
  );

  -- 4. Create recommendation_settings to configure test distribution audience size limits
  create table if not exists public.recommendation_settings (
    id integer primary key default 1,
    stage_1_audience_size integer default 10 not null,
    stage_2_audience_size integer default 50 not null,
    stage_3_audience_size integer default 250 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Insert default fallback configurations for the test audiences
  insert into public.recommendation_settings (id, stage_1_audience_size, stage_2_audience_size, stage_3_audience_size)
  values (1, 10, 50, 250)
  on conflict (id) do update set
    stage_1_audience_size = excluded.stage_1_audience_size,
    stage_2_audience_size = excluded.stage_2_audience_size,
    stage_3_audience_size = excluded.stage_3_audience_size;

  -- 5. Enable Row Level Security (RLS)
  alter table public.recommendation_events enable row level security;
  alter table public.user_interest_signals enable row level security;
  alter table public.recommendation_settings enable row level security;

  -- 6. Add RLS Policies
  
  -- policies for recommendation_events
  drop policy if exists "Recommendation events are viewable by everyone" on public.recommendation_events;
  create policy "Recommendation events are viewable by everyone" on public.recommendation_events
    for select using (true);

  drop policy if exists "Anyone can insert recommendation events" on public.recommendation_events;
  create policy "Anyone can insert recommendation events" on public.recommendation_events
    for insert with check (true);

  -- policies for user_interest_signals
  drop policy if exists "User interest signals are viewable by everyone" on public.user_interest_signals;
  create policy "User interest signals are viewable by everyone" on public.user_interest_signals
    for select using (true);

  drop policy if exists "Users can update their own interest signals" on public.user_interest_signals;
  create policy "Users can update their own interest signals" on public.user_interest_signals
    for all using (auth.uid() = user_id);

  -- policies for recommendation_settings
  drop policy if exists "Recommendation settings are viewable by everyone" on public.recommendation_settings;
  create policy "Recommendation settings are viewable by everyone" on public.recommendation_settings
    for select using (true);

  drop policy if exists "Admins can manage recommendation settings" on public.recommendation_settings;
  create policy "Admins can manage recommendation settings" on public.recommendation_settings
    for all using (
      exists (
        select 1 from public.profiles 
        where id = auth.uid() and role = 'admin'
      )
    );

  -- 7. Add Database Indexes for performance optimization and fast candidate rankings
  create index if not exists idx_recommendation_events_post_id on public.recommendation_events(post_id);
  create index if not exists idx_recommendation_events_user_id on public.recommendation_events(user_id);
  create index if not exists idx_recommendation_events_event_type on public.recommendation_events(event_type);
  create index if not exists idx_recommendation_events_created_at on public.recommendation_events(created_at);

  create index if not exists idx_user_interest_signals_user_id on public.user_interest_signals(user_id);
  create index if not exists idx_posts_category on public.posts(category);

  -- 8. Register to realtime publication
  alter publication supabase_realtime add table recommendation_events;

commit;
