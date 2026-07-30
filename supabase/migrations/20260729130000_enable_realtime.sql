-- Enable realtime for tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table posts, likes, comments, stories, followers, notifications;
