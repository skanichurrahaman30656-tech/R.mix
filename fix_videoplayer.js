const fs = require('fs');

let content = fs.readFileSync('components/shared/VideoPlayer.tsx', 'utf8');

// Replace IntersectionObserver logic
content = content.replace(
  /const observer = new IntersectionObserver\([\s\S]*?\{ threshold: \[0, 0.5\] \}\s*\);/,
  `const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              setInView(true);
              if (autoPlay && videoRef.current) {
                videoRef.current.muted = false; // ensure unmuted when active
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                  playPromise.catch(e => {
                    console.log('Autoplay prevented, retrying muted', e);
                    if (videoRef.current) {
                      videoRef.current.muted = true;
                      videoRef.current.play().catch(err => console.log('Even muted autoplay prevented', err));
                    }
                  });
                }
              }
            } else {
              if (videoRef.current && !videoRef.current.paused) {
                videoRef.current.pause();
              }
            }
          });
        },
        { threshold: [0, 0.5] }
      );`
);

fs.writeFileSync('components/shared/VideoPlayer.tsx', content);
console.log("Fixed VideoPlayer");
