const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Add loadMoreRef
code = code.replace(
  "const storyInputRef = useRef<HTMLInputElement>(null);",
  "const storyInputRef = useRef<HTMLInputElement>(null);\n  const loadMoreRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    const observer = new IntersectionObserver(\n      (entries) => {\n        if (entries[0].isIntersecting && hasMorePosts && !isLoadingMore && !loading) {\n          setPage((p) => {\n            fetchPosts(user?.id, p + 1, true);\n            return p + 1;\n          });\n        }\n      },\n      { threshold: 0.1 }\n    );\n    if (loadMoreRef.current) observer.observe(loadMoreRef.current);\n    return () => observer.disconnect();\n  }, [hasMorePosts, isLoadingMore, loading, user]);"
);

// Add the intersection target after posts.map
const renderTargetRegex = /\s*\}\)\n\s*\)\}\n\s*<\/div>\n\s*\}\)\(\)\}/;

// Wait, let's look at what is after posts.map
code = code.replace(
  "                posts.map(post => (",
  "                <>\n                {posts.map(post => ("
);

// find where map ends
code = code.replace(
  "                  </article>\n                ))\n              )}",
  "                  </article>\n                ))}\n                {hasMorePosts && (\n                  <div className=\"py-6 text-center\" ref={loadMoreRef}>\n                    {isLoadingMore ? (\n                      <div className=\"w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto\"></div>\n                    ) : (\n                      <span className=\"text-xs font-bold text-zinc-500\">Scroll for more</span>\n                    )}\n                  </div>\n                )}\n                </>\n              )}"
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
