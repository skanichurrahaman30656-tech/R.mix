const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const fetchPostsRegex = /const fetchPosts = async \(userId\?: string\) => \{[\s\S]*?setLoading\(false\);\n  \};/;

const replacement = `const fetchPosts = async (userId?: string, pageIndex = page, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setLoading(true);

    const from = isLoadMore ? pageIndex * POSTS_LIMIT : 0;
    const to = isLoadMore ? ((pageIndex + 1) * POSTS_LIMIT) - 1 : ((pageIndex + 1) * POSTS_LIMIT) - 1;

    const { data } = await supabase
      .from('posts')
      .select(\`
        *,
        profiles:user_id ( id, username, full_name, avatar_url ),
        likes ( user_id ),
        comments ( id, content, created_at, profiles:user_id ( id, username, avatar_url ) ),
        saved_posts ( user_id ),
        post_views ( user_id )
      \`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      const formattedPosts = data.map((p: any) => {
        let mediaList: string[] = [];
        if (p.media_url) {
          if (Array.isArray(p.media_url)) {
            mediaList = p.media_url;
          } else if (typeof p.media_url === 'string') {
            try {
              const parsed = JSON.parse(p.media_url);
              if (Array.isArray(parsed)) mediaList = parsed;
              else if (typeof parsed === 'string') mediaList = [parsed];
            } catch {
              mediaList = [p.media_url];
            }
          }
        }
        const likesCount = Array.isArray(p.likes) ? p.likes.length : 0;
        const commentsCount = Array.isArray(p.comments) ? p.comments.length : 0;
        return {
          id: p.id,
          author: p.profiles?.username || p.profiles?.full_name || 'Creator',
          handle: \`@\${p.profiles?.username || 'user'}\`,
          avatar: p.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
          image: mediaList[0] || null,
          media_urls: mediaList,
          type: p.type,
          likes: likesCount,
          comments: Array.isArray(p.comments) ? p.comments : [],
          commentsCount: commentsCount,
          caption: p.content,
          views: Array.isArray(p.post_views) ? p.post_views.length : 0,
          post_views: Array.isArray(p.post_views) ? p.post_views : [],
          isLiked: userId && Array.isArray(p.likes) ? p.likes.some((l: any) => l.user_id === userId) : false,
          isBookmarked: userId && Array.isArray(p.saved_posts) ? p.saved_posts.some((s: any) => s.user_id === userId) : false,
          showComments: false,
          newComment: '',
          user_id: p.user_id,
          created_at: p.created_at
        };
      });

      if (isLoadMore) {
        setPosts(prev => {
          const newPosts = [...prev];
          formattedPosts.forEach(p => {
            if (!newPosts.find(np => np.id === p.id)) newPosts.push(p);
          });
          return newPosts;
        });
        setHasMorePosts(data.length === POSTS_LIMIT);
      } else {
        setPosts(formattedPosts);
        if (pageIndex === 0) {
          setHasMorePosts(data.length === POSTS_LIMIT);
        }
      }
    }
    setLoading(false);
    setIsLoadingMore(false);
  };`;

code = code.replace(fetchPostsRegex, replacement);

const stateRegex = /const \[posts, setPosts\] = useState<any\[\]>\(\[\]\);/;
const stateReplacement = `const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const POSTS_LIMIT = 5;`;

code = code.replace(stateRegex, stateReplacement);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
