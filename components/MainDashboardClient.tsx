"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Home, PlusSquare, PlaySquare, LogOut, Loader2 } from 'lucide-react';

import CreatePostModal from './CreatePostModal';
import EditProfileModal from './EditProfileModal';
import { compressImage } from '@/lib/compress';

export default function MainDashboardClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'feed' | 'reels'>('feed');
  const [storyUploading, setStoryUploading] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);

  const fetchStories = async (userId?: string) => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        id,
        media_url,
        profiles:user_id ( id, username, avatar_url )
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      const formatted = data.map((s: any) => ({
        id: s.id,
        author: s.profiles?.username || 'user',
        avatar: s.profiles?.avatar_url || 'https://picsum.photos/seed/user/100/100',
        hasUnseen: true,
        media_url: s.media_url,
        isUser: s.profiles?.id === userId
      }));
      setStories(formatted);
    }
  };

  const fetchPosts = async (userId?: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id ( id, username, full_name, avatar_url ),
        likes ( user_id ),
        comments ( id, content, created_at, profiles:user_id ( id, username, avatar_url ) ),
        saved_posts ( user_id )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formattedPosts = data.map((p: any) => ({
        id: p.id,
        author: p.profiles?.username || p.profiles?.full_name || 'Unknown',
        handle: `@${p.profiles?.username || ''}`,
        avatar: p.profiles?.avatar_url || 'https://picsum.photos/seed/user/100/100',
        image: p.media_url ? JSON.parse(p.media_url)[0] : null,
        media_urls: p.media_url ? JSON.parse(p.media_url) : [],
        type: p.type,
        likes: p.likes?.length || 0,
        comments: p.comments || [],
        commentsCount: p.comments?.length || 0,
        caption: p.content,
        isLiked: userId ? p.likes?.some((l: any) => l.user_id === userId) : false,
        isBookmarked: userId ? p.saved_posts?.some((s: any) => s.user_id === userId) : false,
        showComments: false,
        newComment: ''
      }));
      setPosts(formattedPosts);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
      
      fetchPosts(session?.user?.id);
      fetchStories(session?.user?.id);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => setProfile(data));
        } else {
          setProfile(null);
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setStoryUploading(true);
    try {
      let finalFile = file;
      let type = 'image';
      if (file.type.startsWith('image/')) {
        finalFile = await compressImage(file, 1080);
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else {
        throw new Error('Unsupported file type');
      }

      const fileExt = finalFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, finalFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(uploadData.path);

      await supabase.from('stories').insert({
        user_id: user.id,
        media_url: publicUrl,
        type: type
      });

      fetchStories(user.id);
    } catch (error) {
      console.error("Story upload error:", error);
      alert("Failed to upload story");
    } finally {
      setStoryUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    router.push('/login');
  };

  const handleLike = async (id: string, isLiked: boolean) => {
    if (!user) return;
    
    // Optimistic update
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          isLiked: !isLiked,
          likes: isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    if (isLiked) {
      await supabase.from('likes').delete().match({ post_id: id, user_id: user.id });
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id });
    }
  };

  const handleBookmark = async (id: string, isBookmarked: boolean) => {
    if (!user) return;

    // Optimistic update
    setPosts(posts.map(post => 
      post.id === id ? { ...post, isBookmarked: !isBookmarked } : post
    ));

    if (isBookmarked) {
      await supabase.from('saved_posts').delete().match({ post_id: id, user_id: user.id });
    } else {
      await supabase.from('saved_posts').insert({ post_id: id, user_id: user.id });
    }
  };

  const handleToggleComments = (id: string) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, showComments: !post.showComments } : post
    ));
  };

  const handleCommentChange = (id: string, text: string) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, newComment: text } : post
    ));
  };

  const submitComment = async (id: string, content: string) => {
    if (!user || !content.trim()) return;

    const { data, error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: content.trim()
    }).select('id, content, created_at, profiles:user_id ( id, username, avatar_url )').single();

    if (data) {
      setPosts(posts.map(post => {
        if (post.id === id) {
          return {
            ...post,
            comments: [...post.comments, data],
            commentsCount: post.commentsCount + 1,
            newComment: ''
          };
        }
        return post;
      }));
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (post.caption && post.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (post.handle && post.handle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesView = viewMode === 'reels' ? post.type === 'video' || post.type === 'reel' : true;
    return matchesSearch && matchesView;
  });

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-16 sm:pb-0">
      {/* Top Navigation - Mobile (replicated on desktop for simplicity, but constrained) */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-2xl font-serif font-bold italic tracking-tighter">R.mix</span>
          
          <div className="flex items-center gap-6">
            <button onClick={() => alert('Notifications clicked')} className="hover:opacity-70 transition-opacity">
              <Heart className="w-6 h-6 text-black" />
            </button>
            <button onClick={() => alert('Messages clicked')} className="hover:opacity-70 transition-opacity">
              <MessageCircle className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>
      </nav>

      {/* Conditional Search Bar */}
      {showSearch && (
        <div className="bg-white px-4 py-2 border-b border-gray-100">
          <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search users or posts..." 
              className="bg-transparent border-none outline-none text-sm w-full text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto py-2">
        {/* Stories Section */}
        <div className="flex gap-4 overflow-x-auto px-4 py-2 scrollbar-hide border-b border-gray-100 pb-4 mb-4">
          
          {/* User's Add Story Button */}
          <div className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer" onClick={() => storyInputRef.current?.click()}>
            <div className="relative rounded-full p-[2px]">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white relative">
                {storyUploading ? (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : null}
                <img referrerPolicy="no-referrer" src={profile?.avatar_url || 'https://picsum.photos/seed/me/100/100'} alt="Your Story" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs leading-none">+</span>
              </div>
            </div>
            <span className="text-xs text-gray-800 truncate w-full text-center">Your Story</span>
            <input 
              type="file" 
              ref={storyInputRef} 
              onChange={handleStoryUpload} 
              accept="image/*,video/mp4,video/quicktime" 
              className="hidden" 
            />
          </div>

          {stories.map(story => (
            <div key={story.id} className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer" onClick={() => window.open(story.media_url, '_blank')}>
              <div className={`relative rounded-full p-[2px] ${story.hasUnseen ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : story.isUser ? '' : 'bg-gray-200'}`}>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                  <img referrerPolicy="no-referrer" src={story.avatar} alt={story.author} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-xs text-gray-800 truncate w-full text-center">{story.author}</span>
            </div>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-10 flex justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No posts found.</div>
          ) : (
            filteredPosts.map(post => (
              <article key={post.id} className="bg-white pb-4 border-b border-gray-100 last:border-0">
                {/* Post Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="w-8 h-8 rounded-full overflow-hidden hover:opacity-80 transition-opacity border border-gray-200">
                      <img referrerPolicy="no-referrer" src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                    </button>
                    <div>
                      <h3 className="font-semibold text-sm hover:opacity-70 cursor-pointer">{post.author}</h3>
                    </div>
                  </div>
                  <button onClick={() => alert('More options clicked')} className="text-black hover:opacity-70 transition-opacity">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Post Image / Video */}
                {post.image && (
                  <div className="aspect-square bg-gray-100 relative" onDoubleClick={() => handleLike(post.id, post.isLiked)}>
                    {post.type === 'video' || post.type === 'reel' ? (
                      <video src={post.image} className="w-full h-full object-cover" controls loop />
                    ) : (
                      <img referrerPolicy="no-referrer" src={post.image} alt="Post content" className="w-full h-full object-cover cursor-pointer" />
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post.id, post.isLiked)} className="hover:opacity-70 transition-opacity">
                        <Heart className={`w-6 h-6 transition-colors ${post.isLiked ? 'fill-red-500 text-red-500' : 'text-black'}`} />
                      </button>
                      <button onClick={() => handleToggleComments(post.id)} className="hover:opacity-70 transition-opacity">
                        <MessageCircle className="w-6 h-6 text-black" />
                      </button>
                      <button onClick={() => alert('Share clicked')} className="hover:opacity-70 transition-opacity">
                        <Share2 className="w-6 h-6 text-black" />
                      </button>
                    </div>
                    <button onClick={() => handleBookmark(post.id, post.isBookmarked)} className="hover:opacity-70 transition-opacity">
                      <Bookmark className={`w-6 h-6 transition-colors ${post.isBookmarked ? 'fill-black text-black' : 'text-black'}`} />
                    </button>
                  </div>
                  
                  {/* Likes Count */}
                  <div className="font-semibold text-sm mb-1">{post.likes.toLocaleString()} likes</div>
                  
                  {/* Caption */}
                  <div className="text-sm mb-1">
                    <span className="font-semibold mr-2 hover:opacity-70 cursor-pointer">{post.author}</span>
                    <span className="text-black break-words">{post.caption}</span>
                  </div>
                  
                  {/* Comments Toggle */}
                  {post.commentsCount > 0 && (
                    <button 
                      onClick={() => handleToggleComments(post.id)} 
                      className="text-gray-500 text-sm hover:opacity-70"
                    >
                      {post.showComments ? 'Hide comments' : `View all ${post.commentsCount} comments`}
                    </button>
                  )}

                  {/* Comments Section */}
                  {post.showComments && (
                    <div className="mt-2 space-y-2 mb-3">
                      {post.comments.map((comment: any) => (
                        <div key={comment.id} className="text-sm flex items-start">
                          <span className="font-semibold mr-2 cursor-pointer hover:opacity-70 shrink-0">
                            {comment.profiles?.username || 'user'}
                          </span>
                          <span className="text-black break-words">{comment.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                       <img referrerPolicy="no-referrer" src={profile?.avatar_url || "https://picsum.photos/seed/me/100/100"} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-500" 
                      value={post.newComment || ''}
                      onChange={(e) => handleCommentChange(post.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitComment(post.id, post.newComment);
                      }}
                    />
                    <button 
                      onClick={() => submitComment(post.id, post.newComment)} 
                      disabled={!post.newComment?.trim()}
                      className="text-blue-500 text-sm font-semibold hover:text-blue-700 disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="max-w-xl mx-auto px-6 h-12 flex items-center justify-between">
          <button onClick={() => setViewMode('feed')} className={`hover:opacity-70 transition-opacity ${viewMode === 'feed' ? 'opacity-100' : 'opacity-50'}`}>
            <Home className="w-7 h-7 text-black" />
          </button>
          <button onClick={() => setShowSearch(!showSearch)} className="hover:opacity-70 transition-opacity opacity-50">
            <Search className="w-7 h-7 text-black" />
          </button>
          <button onClick={() => setShowCreatePost(true)} className="hover:opacity-70 transition-opacity opacity-50">
            <PlusSquare className="w-7 h-7 text-black" />
          </button>
          <button onClick={() => setViewMode('reels')} className={`hover:opacity-70 transition-opacity ${viewMode === 'reels' ? 'opacity-100' : 'opacity-50'}`}>
            <PlaySquare className="w-7 h-7 text-black" />
          </button>
          <div className="relative">
            <button 
              onClick={() => {
                if (user) {
                  setShowProfileMenu(!showProfileMenu);
                } else {
                  router.push('/login');
                }
              }} 
              className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
            >
              <img referrerPolicy="no-referrer" src={profile?.avatar_url || "https://picsum.photos/seed/me/100/100"} alt="Profile" className="w-full h-full object-cover" />
            </button>
            
            {showProfileMenu && user && (
              <div className="absolute bottom-12 right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold truncate">{profile?.username || user.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowEditProfile(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {user && (
        <CreatePostModal 
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          user={user}
          onPostCreated={() => {
            if (user) fetchPosts(user.id);
          }}
        />
      )}

      {user && (
        <EditProfileModal 
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          user={user}
          profile={profile}
          onProfileUpdated={() => {
            supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
              .then(({ data }) => setProfile(data));
          }}
        />
      )}
    </div>
  );
}
