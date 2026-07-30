const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

// Replace the observer effect
const oldEffect = `    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '400px' }
      );
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => {
        observer.disconnect();
      };
    }, []);`;

const newEffect = `    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setInView(true);
            if (entries[0].intersectionRatio >= 0.5) {
              if (autoPlay && videoRef.current) {
                videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
              }
            } else {
              if (videoRef.current && !videoRef.current.paused && autoPlay) {
                videoRef.current.pause();
              }
            }
          } else {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
            }
          }
        },
        { threshold: [0, 0.5] }
      );
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, [autoPlay]);

    // Handle exclusive audio playback
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      
      const handlePlay = (e) => {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          if (v !== e.target) {
            v.pause();
          }
        });
      };
      
      video.addEventListener('play', handlePlay);
      return () => video.removeEventListener('play', handlePlay);
    }, [inView]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('components/VideoPlayer.tsx', code);
