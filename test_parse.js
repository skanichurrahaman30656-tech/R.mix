let p = { media_url: '["https://grkqbppgimklpyhrvqob.supabase.co/storage/v1/object/public/media/fe3f7a94-a0a3-4b5c-a259-3c28c905670b/1785320217754-cda0p.mp4"]' };
let mediaList = [];
if (p.media_url) {
  if (Array.isArray(p.media_url)) {
    mediaList = p.media_url;
  } else if (typeof p.media_url === 'string') {
    try {
      const parsed = JSON.parse(p.media_url);
      if (Array.isArray(parsed)) mediaList = parsed;
      else if (typeof parsed === 'string') mediaList = [parsed];
    } catch {
      mediaList = [p.media_url];
    }
  }
}
console.log(mediaList);
console.log("image:", mediaList[0]);
