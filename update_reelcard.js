const fs = require('fs');
let code = fs.readFileSync('components/reels/ReelCardItem.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (isActive) {
      trackView(supabase, reelItem.type === "video" ? "video" : "reel", reelItem.id);
    }
  }, [isActive, reelItem.id, reelItem.type]);`;

const newEffect = `  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive) {
      timer = setTimeout(() => {
        trackView(supabase, reelItem.type === "video" ? "video" : "reel", reelItem.id, user?.id);
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, reelItem.id, reelItem.type, user?.id]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('components/reels/ReelCardItem.tsx', code);
