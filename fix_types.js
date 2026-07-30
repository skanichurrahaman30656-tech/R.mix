const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(/notifErr\.message/g, "(notifErr as any)?.message");
  code = code.replace(/commentError\.message/g, "(commentError as any)?.message");
  code = code.replace(/saveErr\.message/g, "(saveErr as any)?.message");
  code = code.replace(/followErr\.message/g, "(followErr as any)?.message");
  code = code.replace(/storyErr\.message/g, "(storyErr as any)?.message");
  code = code.replace(/msgErr\.message/g, "(msgErr as any)?.message");
  code = code.replace(/res\.error\.message/g, "(res.error as any)?.message");
  code = code.replace(/likeErr\.message/g, "(likeErr as any)?.message");
  code = code.replace(/reactErr\.message/g, "(reactErr as any)?.message");
  code = code.replace(/replyErr\.message/g, "(replyErr as any)?.message");

  fs.writeFileSync(file, code);
}

fixFile('components/MainDashboardClient.tsx');
fixFile('components/StoryViewer.tsx');
