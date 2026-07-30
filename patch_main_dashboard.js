const fs = require('fs');

let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Patch handleLike
code = code.replace(
  /await supabase\.from\('notifications'\)\.insert\(\{([\s\S]*?)\}\);/g,
  `const { error: notifErr } = await supabase.from('notifications').insert({$1});
        if (notifErr) console.warn('Notification insert failed:', notifErr.message);`
);

// Patch handleComment
code = code.replace(
  /const \{ data \} = await supabase\.from\('comments'\)\.insert\(\{([\s\S]*?)\}\);/g,
  `const { data, error: commentError } = await supabase.from('comments').insert({$1});
    if (commentError) { console.warn('Comment insert failed:', commentError.message); }`
);

// Patch saved_posts
code = code.replace(
  /await supabase\.from\('saved_posts'\)\.insert\(\{ post_id: id, user_id: user\.id \}\);/g,
  `const { error: saveErr } = await supabase.from('saved_posts').insert({ post_id: id, user_id: user.id });
      if (saveErr) console.warn('Save post failed:', saveErr.message);`
);

// Patch follows
code = code.replace(
  /await supabase\.from\('follows'\)\n\s*\.insert\(\{ follower_id: user\.id, following_id: targetUserId \}\);/g,
  `const { error: followErr } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
        if (followErr) console.warn('Follow failed:', followErr.message);`
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
