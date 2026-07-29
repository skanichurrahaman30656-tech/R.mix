ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'skanichurrahaman30656@gmail.com');
