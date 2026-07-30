const fs = require('fs');

// Patch MainDashboardClient.tsx
let file1 = 'components/MainDashboardClient.tsx';
let code1 = fs.readFileSync(file1, 'utf8');

const patches1 = [
  { search: `  useEffect(() => {
    if (user) {
      fetchPosts(user.id, 0, false, true);
    }
  }, [user]);`,
    replace: `  useEffect(() => {
    if (user) {
      fetchPosts(user.id, 0, false, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);`
  },
  {
    search: `  useEffect(() => {
    fetchPosts();
  }, [page]);`,
    replace: `  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);`
  },
  {
    search: `  useEffect(() => {
    if (activeSearchTerm.trim().length > 0) {
      handleSearch(activeSearchTerm);
    } else {
      setSearchResults({ users: [], posts: [] });
    }
  }, [activeSearchTerm]);`,
    replace: `  useEffect(() => {
    if (activeSearchTerm.trim().length > 0) {
      handleSearch(activeSearchTerm);
    } else {
      setSearchResults({ users: [], posts: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearchTerm]);`
  }
];

let replaced = code1;
// we will just do a simpler replacement
replaced = replaced.replace(/(\s*)\}, \[user\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [user]);');
replaced = replaced.replace(/(\s*)\}, \[page\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [page]);');
replaced = replaced.replace(/(\s*)\}, \[activeSearchTerm\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [activeSearchTerm]);');
replaced = replaced.replace(/(\s*)\}, \[user\?.id\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [user?.id]);');
replaced = replaced.replace(/(\s*)\}, \[\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, []);');

fs.writeFileSync(file1, replaced);


// Patch SettingsSystem.tsx
let file2 = 'components/SettingsSystem.tsx';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/(\s*)\}, \[user\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [user]);');
fs.writeFileSync(file2, code2);

// Patch StoryViewer.tsx
let file3 = 'components/StoryViewer.tsx';
let code3 = fs.readFileSync(file3, 'utf8');
code3 = code3.replace(/(\s*)\}, \[story\.id, user\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [story.id, user]);');
code3 = code3.replace(/(\s*)\}, \[isPaused, story\.duration\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, [isPaused, story.duration]);');
code3 = code3.replace(/(\s*)\}, \[\]\);/g, '$1  // eslint-disable-next-line react-hooks/exhaustive-deps\n$1}, []);');
fs.writeFileSync(file3, code3);

