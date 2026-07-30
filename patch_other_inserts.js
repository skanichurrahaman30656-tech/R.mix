const fs = require('fs');

let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// stories
code = code.replace(
  /await supabase\.from\('stories'\)\.insert\(\{([\s\S]*?)\}\);/g,
  `const { error: storyErr } = await supabase.from('stories').insert({$1});
      if (storyErr) console.warn('Story insert failed:', storyErr.message);`
);

// messages
code = code.replace(
  /const \{ data \} = await supabase\.from\('messages'\)\.insert\(\{([\s\S]*?)\}\);/g,
  `const { data, error: msgErr } = await supabase.from('messages').insert({$1});
    if (msgErr) console.warn('Message insert failed:', msgErr.message);`
);

// post_views
code = code.replace(
  /supabase\.from\("post_views"\)\.insert\(\{ post_id: reelId, user_id: user\?\.id \}\)\.then\(\);/g,
  `supabase.from("post_views").insert({ post_id: reelId, user_id: user?.id }).then((res) => {
        if (res.error) console.warn('Post view insert failed:', res.error.message);
      });`
);

// likes
code = code.replace(
  /await supabase\.from\('likes'\)\.insert\(\{ post_id: id, user_id: user\.id \}\);/g,
  `const { error: likeErr } = await supabase.from('likes').insert({ post_id: id, user_id: user.id });
      if (likeErr) console.warn('Like insert failed:', likeErr.message);`
);


fs.writeFileSync('components/MainDashboardClient.tsx', code);

// StoryViewer
code = fs.readFileSync('components/StoryViewer.tsx', 'utf8');
code = code.replace(
  /await supabase\.from\('story_reactions'\)\.insert\(\{([\s\S]*?)\}\);/g,
  `const { error: reactErr } = await supabase.from('story_reactions').insert({$1});
    if (reactErr) console.warn('Story reaction failed:', reactErr.message);`
);
code = code.replace(
  /await supabase\.from\('story_replies'\)\.insert\(\{([\s\S]*?)\}\);/g,
  `const { error: replyErr } = await supabase.from('story_replies').insert({$1});
    if (replyErr) console.warn('Story reply failed:', replyErr.message);`
);
fs.writeFileSync('components/StoryViewer.tsx', code);

