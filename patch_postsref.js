const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Add postsRef
if (!code.includes('const postsRef = useRef(posts);')) {
  code = code.replace(
    'const [posts, setPosts] = useState<any[]>([]);',
    'const [posts, setPosts] = useState<any[]>([]);\n  const postsRef = useRef(posts);\n  useEffect(() => { postsRef.current = posts; }, [posts]);'
  );
}

// Replace posts.length with postsRef.current.length
code = code.replace(
  'else if (posts.length === 0) setLoading(true);',
  'else if (postsRef.current.length === 0) setLoading(true);'
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
