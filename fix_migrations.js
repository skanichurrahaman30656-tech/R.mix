const fs = require('fs');
let code = fs.readFileSync('supabase/migrations/20260729000000_user_settings.sql', 'utf8');

if (!code.includes('create extension if not exists "uuid-ossp"')) {
    code = 'create extension if not exists "uuid-ossp";\n\n' + code;
}

fs.writeFileSync('supabase/migrations/20260729000000_user_settings.sql', code);
