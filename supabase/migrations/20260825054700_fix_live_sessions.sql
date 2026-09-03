begin;

  -- Create Live Sessions table
  create table if not exists public.live_sessions (
    id uuid default gen_random_uuid() primary key,
    host_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text,
    status text default 'live' not null, -- 'live', 'ended'
    viewer_count integer default 0 not null,
    started_at timestamptz default now() not null,
    ended_at timestamptz,
    created_at timestamptz default now() not null
  );

  -- Create Live Comments table
  create table if not exists public.live_comments (
    id uuid default gen_random_uuid() primary key,
    session_id uuid references public.live_sessions(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamptz default now() not null
  );

  -- Enable RLS
  alter table public.live_sessions enable row level security;
  alter table public.live_comments enable row level security;

  -- RLS Policies for live_sessions
  drop policy if exists "Public read live_sessions" on public.live_sessions;
  create policy "Public read live_sessions" on public.live_sessions 
    for select using (true);

  drop policy if exists "Hosts can insert live_sessions" on public.live_sessions;
  create policy "Hosts can insert live_sessions" on public.live_sessions 
    for insert with check (auth.uid() = host_id);

  drop policy if exists "Hosts can update live_sessions" on public.live_sessions;
  create policy "Hosts can update live_sessions" on public.live_sessions 
    for update using (auth.uid() = host_id);

  drop policy if exists "Hosts can delete live_sessions" on public.live_sessions;
  create policy "Hosts can delete live_sessions" on public.live_sessions 
    for delete using (auth.uid() = host_id);

  -- RLS Policies for live_comments
  drop policy if exists "Public read live_comments" on public.live_comments;
  create policy "Public read live_comments" on public.live_comments 
    for select using (true);

  drop policy if exists "Users can insert live_comments" on public.live_comments;
  create policy "Users can insert live_comments" on public.live_comments 
    for insert with check (auth.uid() = user_id);

  -- Enable Realtime
  alter publication supabase_realtime add table live_sessions, live_comments;

commit;

NOTIFY pgrst, 'reload schema';
