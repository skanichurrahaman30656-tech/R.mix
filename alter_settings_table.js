const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { error } = await supabase.rpc('execute_sql', { sql: `
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS story_visibility text DEFAULT 'everyone';
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reel_visibility text DEFAULT 'everyone';
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS data_saver boolean DEFAULT false;
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reduce_motion boolean DEFAULT false;
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS high_contrast boolean DEFAULT false;
  ` });
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Altered successfully.");
  }
}
check();
