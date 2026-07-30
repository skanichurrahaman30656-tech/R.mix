create extension if not exists "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  username text UNIQUE,
  phone_number text,
  two_factor_enabled boolean DEFAULT false,
  public_account boolean DEFAULT true,
  who_can_follow_me text DEFAULT 'everyone',
  who_can_message_me text DEFAULT 'everyone',
  who_can_comment text DEFAULT 'everyone',
  who_can_mention_me text DEFAULT 'everyone',
  who_can_tag_me text DEFAULT 'everyone',
  story_replies text DEFAULT 'everyone',
  allow_emoji_reactions boolean DEFAULT true,
  hide_story_from_users text[] DEFAULT '{}',
  story_archive boolean DEFAULT true,
  story_auto_delete boolean DEFAULT true,
  notification_likes boolean DEFAULT true,
  notification_comments boolean DEFAULT true,
  notification_replies boolean DEFAULT true,
  notification_mentions boolean DEFAULT true,
  notification_tags boolean DEFAULT true,
  notification_messages boolean DEFAULT true,
  notification_calls boolean DEFAULT true,
  notification_story_replies boolean DEFAULT true,
  notification_reels boolean DEFAULT true,
  notification_followers boolean DEFAULT true,
  notification_live boolean DEFAULT true,
  notification_app_updates boolean DEFAULT false,
  language text DEFAULT 'English (US)',
  theme text DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  device_name text,
  ip_address text,
  last_active timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid,
  user_id uuid REFERENCES auth.users(id),
  reaction text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid,
  user_id uuid REFERENCES auth.users(id),
  message text,
  created_at timestamp with time zone DEFAULT now()
);
