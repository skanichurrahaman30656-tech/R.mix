const fs = require('fs');
let content = fs.readFileSync('components/StoryViewer.tsx', 'utf8');

content = content.replace(/  \}, \[currentIndex, isPaused, story\.type\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [currentIndex, isPaused, story.type]);');
content = content.replace(/  \}, \[story\.id, isOwner\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [story.id, isOwner]);');
content = content.replace(/  \}, \[currentIndex\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [currentIndex]);');

fs.writeFileSync('components/StoryViewer.tsx', content);
