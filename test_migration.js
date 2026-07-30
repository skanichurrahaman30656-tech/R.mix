const fs = require('fs');
console.log(fs.readFileSync('supabase/migrations/20260724122300_full_schema.sql', 'utf8').substring(0, 500));
