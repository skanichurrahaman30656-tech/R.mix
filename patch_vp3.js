const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  `    if (videoRef.current && videoRef.current.readyState >= 1) {
      setLoading(false);
    }
      // Reset state on src change
      setLoading(true);`,
  `    // Reset state on src change
    if (videoRef.current && videoRef.current.readyState >= 1) {
      setLoading(false);
    } else {
      setLoading(true);
    }`
);

fs.writeFileSync('components/VideoPlayer.tsx', code);
