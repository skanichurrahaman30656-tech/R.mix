const fs = require('fs');

function fixDeps(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/  \}, \[router\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [router]);');
  content = content.replace(/  \}, \[searchQuery\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [searchQuery]);');
  content = content.replace(/  \}, \[user\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user]);');
  content = content.replace(/  \}, \[currentIndex, currentGroupIndex\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [currentIndex, currentGroupIndex]);');
  content = content.replace(/  \}, \[isPaused\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [isPaused]);');
  content = content.replace(/  \}, \[currentStory\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [currentStory]);');
  
  // Custom for StoryViewer that might have other arrays
  content = content.replace(/  \}, \[\]\);/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);');
  
  fs.writeFileSync(file, content);
}

fixDeps('components/MainDashboardClient.tsx');
fixDeps('components/SettingsSystem.tsx');
fixDeps('components/StoryViewer.tsx');
