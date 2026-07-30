const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Add pageRef
if (!code.includes('const pageRef = useRef(page);')) {
  code = code.replace(
    'const [page, setPage] = useState(0);',
    'const [page, setPage] = useState(0);\n  const pageRef = useRef(page);\n  useEffect(() => { pageRef.current = page; }, [page]);'
  );
}

// Modify fetchPosts signature to use pageRef.current
code = code.replace(
  'const fetchPosts = async (userId?: string, pageIndex = page, isLoadMore = false, forceRefresh = false) => {',
  'const fetchPosts = async (userId?: string, pageIndex = pageRef.current, isLoadMore = false, forceRefresh = false) => {'
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
