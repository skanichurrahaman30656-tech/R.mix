const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  `onLoadedData={() => setLoading(false)}`,
  `onLoadedData={() => setLoading(false)}
            onCanPlay={() => setLoading(false)}
            onLoadedMetadata={() => setLoading(false)}
            onLoadStart={() => {
              // Wait a bit, then force show just in case events don't fire
              setTimeout(() => setLoading(false), 2000);
            }}`
);

// also let's check if the video has loaded implicitly
code = code.replace(
  `useEffect(() => {`,
  `useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 1) {
      setLoading(false);
    }`
);

fs.writeFileSync('components/VideoPlayer.tsx', code);
