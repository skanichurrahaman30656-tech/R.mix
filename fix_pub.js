const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

fetch(supabaseUrl + '/rest/v1/rpc/exec_sql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  },
  body: JSON.stringify({
    sql: `
      begin;
      drop publication if exists supabase_realtime;
      create publication supabase_realtime;
      commit;
      alter publication supabase_realtime add table posts, likes, comments, stories, followers, notifications;
    `
  })
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
