const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('user_settings').select('id').limit(1);
  if (error) {
    console.log("Table check error:", error.message);
  } else {
    console.log("user_settings table exists and is readable.");
  }
}
check();
