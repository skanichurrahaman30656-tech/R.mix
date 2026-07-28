"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Home, 
  PlusSquare, PlaySquare, LogOut, Loader2, Settings, Grid, Film, 
  Image as ImageIcon, BarChart2, Users, Eye, TrendingUp, ChevronRight, 
  UserCheck, Shield, Lock, Bell, Moon, Globe, UserX, HelpCircle, 
  Info, ArrowLeft, Check, Activity, Edit3, Sun, Video, 
  FileText, Music, UserPlus, Flame, Sparkles, Clock, X, Play, 
  Volume2, User, ArrowUpRight, BarChart3
} from 'lucide-react';

import CreatePostModal from './CreatePostModal';
import EditProfileModal from './EditProfileModal';
import { compressImage } from '@/lib/compress';

const sampleReelsList = [
  {
    id: 'reel-sample-1',
    author: 'creative_vibes',
    handle: '@creative_vibes',
    avatar: 'https://picsum.photos/seed/creative/120/120',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1187-large.mp4',
    caption: 'Golden hour moments in nature 🌲✨ #nature #reels #explore',
    likes: 4820,
    commentsCount: 312,
    sharesCount: 145,
    music: 'Original Audio - creative_vibes',
    isLiked: false,
    user_id: 'creative'
  },
  {
    id: 'reel-sample-2',
    author: 'cyber_tokyo',
    handle: '@cyber_tokyo',
    avatar: 'https://picsum.photos/seed/tokyo/120/120',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-neon-sign-at-night-42898-large.mp4',
    caption: 'Tokyo night street aesthetic! 🌃 #tokyo #neon #cyberpunk',
    likes: 12400,
    commentsCount: 890,
    sharesCount: 520,
    music: 'Tokyo Synthwave - DJ Neon',
    isLiked: true,
    user_id: 'tokyo'
  },
  {
    id: 'reel-sample-3',
    author: 'pacific_waves',
    handle: '@pacific_waves',
    avatar: 'https://picsum.photos/seed/ocean/120/120',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    caption: 'Pure ocean wave relaxation 🌊 #satisfying #ocean #relax',
    likes: 9350,
    commentsCount: 420,
    sharesCount: 310,
    music: 'Ocean Meditations - Ambient',
    isLiked: false,
    user_id: 'ocean'
  }
];

const suggestedUsersList = [
  { id: 's1', username: 'alex_designer', full_name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/alex/100/100', bio: 'UI/UX Creator & Visual Artist' },
  { id: 's2', username: 'sarah_photos', full_name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/100/100', bio: 'Travel & Lifestyle Photography' },
  { id: 's3', username: 'tech_pulse', full_name: 'Tech Pulse', avatar: 'https://picsum.photos/seed/tech/100/100', bio: 'Latest tech news & innovations' },
  { id: 's4', username: 'david_fitness', full_name: 'David Miller', avatar: 'https://picsum.photos/seed/david/100/100', bio: 'Daily workouts & healthy lifestyle' },
];

export default function MainDashboardClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Modals & Mode States
  const [showCreateChoiceModal, setShowCreateChoiceModal] = useState(false);
  const [createMode, setCreateMode] = useState<'photo' | 'video' | 'reel' | 'text'>('text');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'feed' | 'reels' | 'profile' | 'settings' | 'search'>('feed');
  const [profileTab, setProfileTab] = useState<'posts' | 'reels' | 'photos'>('posts');
  const [activeSettingToast, setActiveSettingToast] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [storyUploading, setStoryUploading] = useState(false);
  
  // Search & Reel States
  const [recentSearches, setRecentSearches] = useState<string[]>(['#photography', 'alex_designer', '#trending_reels', 'tech_pulse']);
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  
  const storyInputRef = useRef<HTMLInputElement>(null);

  const triggerSettingNotice = (title: string) => {
    setActiveSettingToast(title);
    setTimeout(() => setActiveSettingToast(null), 3000);
  };

  const toggleFollow = (username: string) => {
    setFollowedUsers(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  const toggleReelLike = (reelId: string) => {
    setLikedReels(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };

  const fetchStories = async (userId?: string) => {
    const { data } = await supabase
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
        avatar: s.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
        hasUnseen: true,
        media_url: s.media_url,
        isUser: s.profiles?.id === userId
      }));
      setStories(formatted);
    }
  };

  const fetchPosts = async (userId?: string) => {
    setLoading(true);
    const { data } = await supabase
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

        return {
          id: p.id,
          author: p.profiles?.username || p.profiles?.full_name || 'Unknown',
          handle: `@${p.profiles?.username || ''}`,
          avatar: p.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
          image: mediaList[0] || null,
          media_urls: mediaList,
          type: p.type,
          likes: Array.isArray(p.likes) ? p.likes.length : (typeof p.likes === 'number' ? p.likes : 0),
          comments: Array.isArray(p.comments) ? p.comments : [],
          commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
          caption: p.content,
          isLiked: userId && Array.isArray(p.likes) ? p.likes.some((l: any) => l.user_id === userId) : false,
          isBookmarked: userId && Array.isArray(p.saved_posts) ? p.saved_posts.some((s: any) => s.user_id === userId) : false,
          showComments: false,
          newComment: '',
          user_id: p.user_id
        };
      });
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
    router.push('/login');
  };

  const handleLike = async (id: string, isLiked: boolean) => {
    if (!user) return;
    
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

    const { data } = await supabase.from('comments').insert({
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

  // Filtered posts for search
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.author.toLowerCase().includes(query) || 
      (post.caption && post.caption.toLowerCase().includes(query)) ||
      (post.handle && post.handle.toLowerCase().includes(query))
    );
  });

  // User Profile Posts
  const userOwnPosts = posts.filter(p => p.user_id === user?.id || p.author === profile?.username);
  const profileDisplayPosts = userOwnPosts.length > 0 ? userOwnPosts : posts;

  const profileTabFilteredPosts = profileDisplayPosts.filter(p => {
    if (profileTab === 'reels') return p.type === 'video' || p.type === 'reel';
    if (profileTab === 'photos') return p.type !== 'video' && p.type !== 'reel' && p.image;
    return true;
  });

  // Combine DB video posts with sample reels for dedicated Reels View
  const dbVideoPosts = posts.filter(p => p.type === 'video' || p.type === 'reel');
  const allReelsFeed = [...dbVideoPosts, ...sampleReelsList];

  // Dashboard Stats Calculations
  const totalLikesCount = profileDisplayPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalCommentsCount = profileDisplayPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

  return (
    <div className={`min-h-screen font-sans pb-16 sm:pb-0 transition-colors duration-200 ${isDarkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* Toast Notification */}
      {activeSettingToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Opened {activeSettingToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 z-40 border-b transition-colors ${isDarkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'} backdrop-blur-md`}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* R.MIX Brand Logo (UPDATE 4: Tapping logo returns to global home feed) */}
          <div 
            onClick={() => {
              setViewMode('feed');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="relative flex items-center justify-center">
              <span className="text-3xl font-black font-serif bg-gradient-to-tr from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] tracking-tighter">
                R
              </span>
              <span className="text-xl font-bold font-sans bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400 bg-clip-text text-transparent tracking-widest ml-0.5">
                .MIX
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {viewMode === 'profile' && (
              <button 
                onClick={() => setViewMode('settings')} 
                className={`p-1.5 rounded-full hover:bg-zinc-800/50 transition-colors ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}
                title="Settings"
              >
                <Settings className="w-6 h-6" />
              </button>
            )}

            {viewMode === 'settings' && (
              <button 
                onClick={() => setViewMode('profile')} 
                className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Profile</span>
              </button>
            )}

            {(viewMode === 'feed' || viewMode === 'reels' || viewMode === 'search') && (
              <>
                <button onClick={() => alert('Notifications clicked')} className="hover:opacity-70 transition-opacity">
                  <Heart className={`w-6 h-6 ${isDarkMode ? 'text-zinc-50' : 'text-zinc-900'}`} />
                </button>
                <button onClick={() => alert('Messages clicked')} className="hover:opacity-70 transition-opacity">
                  <MessageCircle className={`w-6 h-6 ${isDarkMode ? 'text-zinc-50' : 'text-zinc-900'}`} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-2">
        
        {/* ==================== VIEW MODE 1: GLOBAL HOME FEED (UPDATE 4) ==================== */}
        {viewMode === 'feed' && (
          <>
            {/* Stories Bar */}
            <div className={`flex gap-4 overflow-x-auto px-4 py-2 scrollbar-hide border-b pb-4 mb-4 ${isDarkMode ? 'border-zinc-900' : 'border-zinc-200'}`}>
              
              {/* Add Story Button */}
              <div className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer" onClick={() => storyInputRef.current?.click()}>
                <div className="relative rounded-full p-[2px]">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-950 relative">
                    {storyUploading ? (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
                      </div>
                    ) : null}
                    <img referrerPolicy="no-referrer" src={profile?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt="Your Story" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center border-2 border-zinc-950">
                    <span className="text-white text-xs leading-none font-bold">+</span>
                  </div>
                </div>
                <span className={`text-xs truncate w-full text-center ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>Your Story</span>
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
                  <div className={`relative rounded-full p-[2px] ${story.hasUnseen ? 'bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500' : 'bg-zinc-800'}`}>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-950">
                      <img referrerPolicy="no-referrer" src={story.avatar} alt={story.author} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className={`text-xs truncate w-full text-center ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{story.author}</span>
                </div>
              ))}
            </div>

            {/* Posts Feed - Displays posts from all users */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-10 flex justify-center"><div className="w-8 h-8 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div></div>
              ) : posts.length === 0 ? (
                <div className="text-center text-zinc-400 py-10">No posts in global feed yet.</div>
              ) : (
                posts.map(post => (
                  <article key={post.id} className={`pb-4 border-b last:border-0 ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'}`}>
                    
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-full overflow-hidden hover:opacity-80 transition-opacity border border-zinc-800">
                          <img referrerPolicy="no-referrer" src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                        </button>
                        <div>
                          <h3 className="font-semibold text-sm hover:opacity-70 cursor-pointer">{post.author}</h3>
                          {post.handle && <p className="text-[11px] text-zinc-400">{post.handle}</p>}
                        </div>
                      </div>
                      <button onClick={() => alert('Options')} className="hover:opacity-70 transition-opacity">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Media */}
                    {post.image && (
                      <div className="aspect-square bg-zinc-900 relative rounded-md overflow-hidden mx-4 my-2 border border-zinc-800/50" onDoubleClick={() => handleLike(post.id, post.isLiked)}>
                        {post.type === 'video' || post.type === 'reel' ? (
                          <video src={post.image} className="w-full h-full object-cover" controls loop />
                        ) : (
                          <img referrerPolicy="no-referrer" src={post.image} alt="Post content" className="w-full h-full object-cover cursor-pointer" />
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleLike(post.id, post.isLiked)} className="hover:opacity-70 transition-opacity">
                            <Heart className={`w-6 h-6 transition-colors ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                          <button onClick={() => handleToggleComments(post.id)} className="hover:opacity-70 transition-opacity">
                            <MessageCircle className="w-6 h-6" />
                          </button>
                          <button onClick={() => alert('Share clicked')} className="hover:opacity-70 transition-opacity">
                            <Share2 className="w-6 h-6" />
                          </button>
                        </div>
                        <button onClick={() => handleBookmark(post.id, post.isBookmarked)} className="hover:opacity-70 transition-opacity">
                          <Bookmark className={`w-6 h-6 transition-colors ${post.isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="font-semibold text-sm mb-1">{post.likes.toLocaleString()} likes</div>
                      
                      <div className="text-sm mb-1">
                        <span className="font-semibold mr-2 hover:opacity-70 cursor-pointer">{post.author}</span>
                        <span className="break-words">{post.caption}</span>
                      </div>
                      
                      {post.commentsCount > 0 && (
                        <button 
                          onClick={() => handleToggleComments(post.id)} 
                          className="text-zinc-400 text-sm hover:opacity-70"
                        >
                          {post.showComments ? 'Hide comments' : `View all ${post.commentsCount} comments`}
                        </button>
                      )}

                      {post.showComments && (
                        <div className="mt-2 space-y-2 mb-3">
                          {post.comments.map((comment: any) => (
                            <div key={comment.id} className="text-sm flex items-start">
                              <span className="font-semibold mr-2 cursor-pointer hover:opacity-70 shrink-0">
                                {comment.profiles?.username || 'user'}
                              </span>
                              <span className="break-words">{comment.content}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                          <img referrerPolicy="no-referrer" src={profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="Profile" className="w-full h-full object-cover" />
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
                          className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 disabled:opacity-50"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}

        {/* ==================== VIEW MODE 2: DEDICATED SEARCH PAGE (UPDATE 3) ==================== */}
        {viewMode === 'search' && (
          <div className="px-4 py-2 space-y-6">
            
            {/* Large Search Bar */}
            <div className={`sticky top-16 z-30 p-2 rounded-2xl border shadow-lg flex items-center gap-3 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}>
              <Search className="w-6 h-6 text-indigo-400 shrink-0 ml-1" />
              <input 
                type="text" 
                placeholder="Search users, hashtags, reels, posts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-base font-medium placeholder-zinc-500"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-zinc-400 hover:text-zinc-200">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Recent Searches */}
            {!searchQuery && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Searches</span>
                  <button onClick={() => setRecentSearches([])} className="text-xs text-indigo-400 font-semibold hover:underline">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.length === 0 ? (
                    <span className="text-xs text-zinc-500">No recent searches</span>
                  ) : (
                    recentSearches.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSearchQuery(item)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer flex items-center gap-1.5 border transition-colors ${
                          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800' : 'bg-zinc-200 border-zinc-300 text-zinc-800 hover:bg-zinc-300'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{item}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches(recentSearches.filter((_, i) => i !== idx));
                          }}
                          className="hover:text-red-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Trending Hashtags */}
            {!searchQuery && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>Trending Hashtags</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['#photography', '#viral_reels', '#tech_innovations', '#travel_diaries'].map((tag, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSearchQuery(tag)}
                      className={`p-3 rounded-xl border text-left transition-colors flex justify-between items-center ${
                        isDarkMode ? 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800/80' : 'bg-white border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-indigo-400">{tag}</div>
                        <div className="text-[11px] text-zinc-400">{12 + idx * 8}.5k posts</div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Users */}
            {!searchQuery && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Suggested Users</span>
                <div className="space-y-2">
                  {suggestedUsersList.map(sUser => (
                    <div 
                      key={sUser.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img referrerPolicy="no-referrer" src={sUser.avatar} alt={sUser.username} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                        <div>
                          <div className="font-semibold text-sm">{sUser.full_name}</div>
                          <div className="text-xs text-indigo-400">@{sUser.username}</div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">{sUser.bio}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleFollow(sUser.username)}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                          followedUsers[sUser.username]
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                        }`}
                      >
                        {followedUsers[sUser.username] ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Reels */}
            {!searchQuery && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Suggested Reels</span>
                  <button onClick={() => setViewMode('reels')} className="text-xs text-indigo-400 font-semibold hover:underline">
                    Watch All
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {sampleReelsList.map(reel => (
                    <div 
                      key={reel.id}
                      onClick={() => setViewMode('reels')}
                      className="min-w-[130px] w-[130px] aspect-[9/16] rounded-xl bg-zinc-900 relative overflow-hidden group cursor-pointer border border-zinc-800 shrink-0"
                    >
                      <video src={reel.video} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                          <Play className="w-3 h-3 fill-white" />
                          <span>{(reel.likes / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="text-[10px] truncate text-zinc-300">@{reel.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infinite Search Results */}
            {searchQuery && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Search Results for &quot;{searchQuery}&quot;
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
                    No posts or users found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map(post => (
                      <div key={post.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3`}>
                        <div className="flex items-center gap-3">
                          <img referrerPolicy="no-referrer" src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full object-cover border border-zinc-700" />
                          <div>
                            <div className="font-bold text-sm">{post.author}</div>
                            <div className="text-xs text-indigo-400">{post.handle}</div>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-200">{post.caption}</p>
                        {post.image && (
                          <div className="aspect-video bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                            {post.type === 'video' || post.type === 'reel' ? (
                              <video src={post.image} className="w-full h-full object-cover" controls />
                            ) : (
                              <img referrerPolicy="no-referrer" src={post.image} alt="Media" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                          <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-400" /> {post.likes}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 text-indigo-400" /> {post.commentsCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ==================== VIEW MODE 3: DEDICATED REELS PAGE (UPDATE 5) ==================== */}
        {viewMode === 'reels' && (
          <div className="h-[calc(100vh-3.5rem-4rem)] snap-y snap-mandatory overflow-y-auto scrollbar-hide px-2">
            {allReelsFeed.map((reelItem: any) => {
              const reelId = reelItem.id;
              const isLiked = likedReels[reelId] ?? reelItem.isLiked;
              const isFollowing = followedUsers[reelItem.author] ?? false;
              const mediaSrc = reelItem.video || reelItem.image || 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1187-large.mp4';

              return (
                <div 
                  key={reelId} 
                  className="snap-start h-full min-h-[540px] max-h-[720px] my-2 relative rounded-2xl overflow-hidden bg-black text-white flex flex-col justify-end p-4 border border-zinc-800 shadow-2xl"
                >
                  {/* Vertical Video Player */}
                  <video 
                    src={mediaSrc} 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10 pointer-events-none" />

                  {/* Left Bottom Details Overlay */}
                  <div className="relative z-20 space-y-3 max-w-[80%]">
                    
                    {/* User Profile & Follow */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 shadow">
                        <img referrerPolicy="no-referrer" src={reelItem.avatar || "https://picsum.photos/seed/user/100/100"} alt="Reel Author" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight drop-shadow">@{reelItem.author}</div>
                      </div>
                      <button 
                        onClick={() => toggleFollow(reelItem.author)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow ${
                          isFollowing 
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>

                    {/* Caption */}
                    <p className="text-xs sm:text-sm text-zinc-100 leading-snug drop-shadow line-clamp-2">
                      {reelItem.caption || reelItem.content || 'Trending Reel #reels #explore'}
                    </p>

                    {/* Music Title */}
                    <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
                      <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      <span className="truncate">{reelItem.music || `Original Sound - @${reelItem.author}`}</span>
                    </div>
                  </div>

                  {/* Right Sidebar Interactive Actions */}
                  <div className="absolute right-3 bottom-12 z-20 flex flex-col items-center gap-5">
                    
                    {/* Like Button */}
                    <button 
                      onClick={() => toggleReelLike(reelId)}
                      className="flex flex-col items-center group"
                    >
                      <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
                        <Heart className={`w-6 h-6 transition-transform group-active:scale-125 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </div>
                      <span className="text-[11px] font-bold mt-1 drop-shadow">
                        {((reelItem.likes || 1200) + (isLiked ? 1 : 0)).toLocaleString()}
                      </span>
                    </button>

                    {/* Comment Button */}
                    <button 
                      onClick={() => alert(`Comments for ${reelItem.author}`)}
                      className="flex flex-col items-center group"
                    >
                      <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-bold mt-1 drop-shadow">
                        {reelItem.commentsCount || 184}
                      </span>
                    </button>

                    {/* Share Button */}
                    <button 
                      onClick={() => alert('Reel link copied to clipboard!')}
                      className="flex flex-col items-center group"
                    >
                      <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
                        <Share2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-bold mt-1 drop-shadow">
                        {reelItem.sharesCount || 89}
                      </span>
                    </button>

                    {/* Music Spinning Record */}
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-indigo-400 overflow-hidden flex items-center justify-center animate-spin mt-2" style={{ animationDuration: '6s' }}>
                      <Music className="w-4 h-4 text-indigo-400" />
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ==================== VIEW MODE 4: REARRANGED PROFILE PAGE (UPDATE 1) ==================== */}
        {viewMode === 'profile' && (
          <div className="px-4 py-2 space-y-6">
            
            {/* 1) Profile Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-5">
                
                {/* Large Profile Photo */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md">
                    <img 
                      referrerPolicy="no-referrer" 
                      src={profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover rounded-full border-2 border-zinc-950" 
                    />
                  </div>
                  <button 
                    onClick={() => setShowEditProfile(true)}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-500 transition-colors"
                    title="Change Photo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Display Name & Username */}
                <div className="space-y-1 flex-1">
                  <h1 className="text-lg font-bold tracking-tight">
                    {profile?.full_name || profile?.username || 'Member'}
                  </h1>
                  <p className="text-xs font-semibold text-indigo-400">
                    @{profile?.username || 'user'}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                    {profile?.bio || '✨ Digital creator & media enthusiast | Building creative projects and sharing highlights.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2) Followers / Following / Posts Stats */}
            <div className={`p-3 rounded-xl border flex justify-around text-center ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div>
                <div className="font-bold text-lg">{profileDisplayPosts.length}</div>
                <div className="text-xs text-zinc-400 font-medium">Posts</div>
              </div>
              <div className="border-r border-zinc-800/50 h-8 my-auto" />
              <div>
                <div className="font-bold text-lg">1,420</div>
                <div className="text-xs text-zinc-400 font-medium">Followers</div>
              </div>
              <div className="border-r border-zinc-800/50 h-8 my-auto" />
              <div>
                <div className="font-bold text-lg">385</div>
                <div className="text-xs text-zinc-400 font-medium">Following</div>
              </div>
            </div>

            {/* 3) Edit Profile Button */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowEditProfile(true)} 
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors border shadow-sm ${
                  isDarkMode 
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800' 
                    : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
                }`}
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setViewMode('settings')} 
                className={`py-2.5 px-3.5 rounded-xl font-semibold text-sm transition-colors border shadow-sm ${
                  isDarkMode 
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800' 
                    : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* 4) Professional Dashboard Summary Card (Opens Complete Analytics View when tapped) */}
            <div 
              onClick={() => setShowFullDashboard(true)}
              className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gradient-to-r from-indigo-950/60 to-zinc-900 border-indigo-900/50 hover:border-indigo-500' : 'bg-gradient-to-r from-indigo-50 to-white border-indigo-200 hover:border-indigo-400'} transition-all cursor-pointer group shadow-sm space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-sm tracking-wide">Professional Dashboard</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                  <span>View Full Analytics</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                  <div className="text-[10px] text-zinc-400">Total Views</div>
                  <div className="text-sm font-bold text-indigo-400">24.8K</div>
                </div>
                <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                  <div className="text-[10px] text-zinc-400">Engagement</div>
                  <div className="text-sm font-bold text-emerald-400">6.8%</div>
                </div>
                <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                  <div className="text-[10px] text-zinc-400">Reach</div>
                  <div className="text-sm font-bold text-purple-400">18.2K</div>
                </div>
              </div>
            </div>

            {/* 5) Posts / Reels / Photos Tabs */}
            <div className={`border-t border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex justify-around">
                <button 
                  onClick={() => setProfileTab('posts')}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    profileTab === 'posts' 
                      ? 'border-indigo-500 text-indigo-400' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Posts</span>
                </button>

                <button 
                  onClick={() => setProfileTab('reels')}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    profileTab === 'reels' 
                      ? 'border-indigo-500 text-indigo-400' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Reels</span>
                </button>

                <button 
                  onClick={() => setProfileTab('photos')}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    profileTab === 'photos' 
                      ? 'border-indigo-500 text-indigo-400' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photos</span>
                </button>
              </div>
            </div>

            {/* 6) Media Grid */}
            {profileTabFilteredPosts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No items found in {profileTab}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {profileTabFilteredPosts.map((p) => (
                  <div key={p.id} className="aspect-square bg-zinc-900 relative rounded overflow-hidden group cursor-pointer border border-zinc-800/40">
                    {p.type === 'video' || p.type === 'reel' ? (
                      <video src={p.image} className="w-full h-full object-cover" />
                    ) : p.image ? (
                      <img referrerPolicy="no-referrer" src={p.image} alt="Post item" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-xs text-zinc-400 text-center bg-zinc-900">
                        {p.caption?.substring(0, 30) || 'Text post'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-white" /> {p.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 fill-white" /> {p.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==================== VIEW MODE 5: SETTINGS PAGE ==================== */}
        {viewMode === 'settings' && (
          <div className="px-4 py-2 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setViewMode('profile')}
                  className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </button>
                <h1 className="text-lg font-bold">Settings & Privacy</h1>
              </div>
            </div>

            {/* Account Info Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-700">
                  <img referrerPolicy="no-referrer" src={profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{profile?.full_name || profile?.username || 'User Account'}</div>
                  <div className="text-xs text-zinc-400">{user?.email}</div>
                </div>
              </div>
              <button 
                onClick={() => setShowEditProfile(true)} 
                className="text-xs text-indigo-400 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            {/* Settings Sections */}
            <div className="space-y-4">
              
              {/* Group 1: Account & Security */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  Account & Security
                </div>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  
                  <button 
                    onClick={() => triggerSettingNotice('Account Settings')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm font-medium">Account</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>

                  <button 
                    onClick={() => triggerSettingNotice('Privacy Settings')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium">Privacy</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>

                  <button 
                    onClick={() => triggerSettingNotice('Security & Password')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-medium">Security</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Group 2: Preferences */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  Preferences
                </div>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  
                  <button 
                    onClick={() => triggerSettingNotice('Notifications Preferences')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-amber-400" />
                      <span className="text-sm font-medium">Notifications</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>

                  <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800/40">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      <span className="text-sm font-medium">Appearance</span>
                    </div>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        isDarkMode 
                          ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' 
                          : 'bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-zinc-300'
                      }`}
                    >
                      {isDarkMode ? 'Dark' : 'Light'}
                    </button>
                  </div>

                  <button 
                    onClick={() => triggerSettingNotice('Language Settings')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-teal-400" />
                      <span className="text-sm font-medium">Language</span>
                    </div>
                    <span className="text-xs text-zinc-400">English (US)</span>
                  </button>
                </div>
              </div>

              {/* Group 3: Content & Activity */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  Content & Activity
                </div>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  
                  <button 
                    onClick={() => triggerSettingNotice('Blocked Users Manager')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <UserX className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-medium">Blocked Users</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>

                  <button 
                    onClick={() => triggerSettingNotice('Saved Posts')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-5 h-5 text-pink-400" />
                      <span className="text-sm font-medium">Saved Posts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Group 4: Support & Legal */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  Support & Legal
                </div>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  
                  <button 
                    onClick={() => triggerSettingNotice('Help & Support Center')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm font-medium">Help & Support</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>

                  <button 
                    onClick={() => triggerSettingNotice('About R.MIX v2.4.0')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-medium">About</span>
                    </div>
                    <span className="text-xs text-zinc-400">v2.4.0</span>
                  </button>
                </div>
              </div>

              {/* Group 5: Logout */}
              <div className="pt-2">
                <button 
                  onClick={handleLogout}
                  className="w-full py-3.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 w-full border-t z-40 transition-colors ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="max-w-xl mx-auto px-6 h-12 flex items-center justify-between">
          
          {/* UPDATE 4: Home button always returns to global feed */}
          <button 
            onClick={() => {
              setViewMode('feed');
              setSearchQuery('');
            }} 
            className={`hover:opacity-70 transition-opacity ${viewMode === 'feed' ? 'opacity-100 text-indigo-400' : 'opacity-50'}`}
            title="Home"
          >
            <Home className="w-7 h-7" />
          </button>

          {/* UPDATE 3: Search button opens dedicated Search page */}
          <button 
            onClick={() => setViewMode('search')} 
            className={`hover:opacity-70 transition-opacity ${viewMode === 'search' ? 'opacity-100 text-indigo-400' : 'opacity-50'}`}
            title="Search"
          >
            <Search className="w-7 h-7" />
          </button>

          {/* UPDATE 2: Plus button opens 4 post creator choices */}
          <button 
            onClick={() => setShowCreateChoiceModal(true)} 
            className="hover:opacity-70 transition-opacity opacity-70 hover:opacity-100 text-indigo-400"
            title="Create Post"
          >
            <PlusSquare className="w-7 h-7" />
          </button>

          {/* UPDATE 5: Reels button opens dedicated Reels page */}
          <button 
            onClick={() => setViewMode('reels')} 
            className={`hover:opacity-70 transition-opacity ${viewMode === 'reels' ? 'opacity-100 text-indigo-400' : 'opacity-50'}`}
            title="Reels"
          >
            <PlaySquare className="w-7 h-7" />
          </button>
          
          {/* Profile button */}
          <button 
            onClick={() => {
              if (user) {
                setViewMode('profile');
              } else {
                router.push('/login');
              }
            }} 
            className={`w-7 h-7 rounded-full bg-zinc-800 overflow-hidden border transition-all ${
              viewMode === 'profile' || viewMode === 'settings' 
                ? 'border-indigo-500 ring-2 ring-indigo-500/50 opacity-100 scale-105' 
                : 'border-zinc-700 opacity-60 hover:opacity-100'
            }`}
            title="Profile"
          >
            <img referrerPolicy="no-referrer" src={profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </nav>

      {/* ==================== UPDATE 2: CREATE CHOICE MODAL ==================== */}
      {showCreateChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-5 space-y-4 shadow-2xl ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-lg">Create New Content</h3>
              <button onClick={() => setShowCreateChoiceModal(false)} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Photo Choice */}
              <button 
                onClick={() => {
                  setCreateMode('photo');
                  setShowCreateChoiceModal(false);
                  setShowCreatePost(true);
                }}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:scale-[1.02] transition-all ${
                  isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">Photo</span>
              </button>

              {/* Video Choice */}
              <button 
                onClick={() => {
                  setCreateMode('video');
                  setShowCreateChoiceModal(false);
                  setShowCreatePost(true);
                }}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:scale-[1.02] transition-all ${
                  isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                  <Video className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">Video</span>
              </button>

              {/* Reel Choice */}
              <button 
                onClick={() => {
                  setCreateMode('reel');
                  setShowCreateChoiceModal(false);
                  setShowCreatePost(true);
                }}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:scale-[1.02] transition-all ${
                  isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
                  <Film className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">Reel</span>
              </button>

              {/* Text Choice */}
              <button 
                onClick={() => {
                  setCreateMode('text');
                  setShowCreateChoiceModal(false);
                  setShowCreatePost(true);
                }}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:scale-[1.02] transition-all ${
                  isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== UPDATE 1: FULL PROFESSIONAL DASHBOARD MODAL ==================== */}
      {showFullDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border p-6 space-y-6 overflow-y-auto shadow-2xl my-auto ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-10 pt-1">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-indigo-400" />
                <h2 className="text-lg font-bold">Professional Analytics Dashboard</h2>
              </div>
              <button onClick={() => setShowFullDashboard(false)} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Last 30 Days Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Last 30 Days Analytics</span>
                <p className="text-xs text-zinc-400">Performance summary from June 28 - July 28</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold">
                Active Account
              </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-[11px] text-zinc-400">Total Views</div>
                <div className="text-xl font-bold text-blue-400">24.8K</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3 h-3" /> +14.2%
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-[11px] text-zinc-400">Reach</div>
                <div className="text-xl font-bold text-purple-400">18.2K</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3 h-3" /> +11.8%
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-[11px] text-zinc-400">Engagement Rate</div>
                <div className="text-xl font-bold text-emerald-400">6.8%</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3 h-3" /> +2.4%
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-[11px] text-zinc-400">Watch Time</div>
                <div className="text-xl font-bold text-amber-400">142 hrs</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                  <TrendingUp className="w-3 h-3" /> +19.5%
                </div>
              </div>
            </div>

            {/* Interaction Breakdown (Likes, Comments, Shares, Saves) */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Interaction Details</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mb-1">
                    <Heart className="w-3.5 h-3.5 fill-red-400" />
                    <span>Likes</span>
                  </div>
                  <div className="text-lg font-bold">1,840</div>
                </div>

                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 mb-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Comments</span>
                  </div>
                  <div className="text-lg font-bold">320</div>
                </div>

                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Shares</span>
                  </div>
                  <div className="text-lg font-bold">156</div>
                </div>

                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-pink-400 mb-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Saves</span>
                  </div>
                  <div className="text-lg font-bold">98</div>
                </div>
              </div>
            </div>

            {/* Followers Growth & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-400">Followers Growth</span>
                  <span className="text-xs text-emerald-400 font-bold">+248 new</span>
                </div>
                <div className="text-2xl font-black">1,420</div>
                <p className="text-[11px] text-zinc-400">82% acquired through viral Reels</p>
              </div>

              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-2`}>
                <span className="text-xs font-bold uppercase text-zinc-400">Audience Demographics</span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>18-24 years</span>
                    <span className="font-bold text-indigo-400">42%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>25-34 years</span>
                    <span className="font-bold text-indigo-400">38%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Location</span>
                    <span className="font-bold text-indigo-400">United States (48%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Posts & Reels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-3`}>
                <span className="text-xs font-bold uppercase text-indigo-400">Top Performing Posts</span>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950/60 flex justify-between items-center">
                    <div>
                      <div className="font-semibold truncate max-w-[140px]">Sunset Beach Reel</div>
                      <div className="text-[10px] text-zinc-400">12.4K views</div>
                    </div>
                    <span className="text-emerald-400 font-bold">1,240 likes</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950/60 flex justify-between items-center">
                    <div>
                      <div className="font-semibold truncate max-w-[140px]">Tokyo Night Walk</div>
                      <div className="text-[10px] text-zinc-400">8.9K views</div>
                    </div>
                    <span className="text-emerald-400 font-bold">890 likes</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-3`}>
                <span className="text-xs font-bold uppercase text-purple-400">Top Performing Reels</span>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-zinc-950/60 flex justify-between items-center">
                    <div>
                      <div className="font-semibold truncate max-w-[140px]">Neon Sign Reel</div>
                      <div className="text-[10px] text-zinc-400">18.5K views</div>
                    </div>
                    <span className="text-purple-400 font-bold">520 shares</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-950/60 flex justify-between items-center">
                    <div>
                      <div className="font-semibold truncate max-w-[140px]">Ocean Waves Loop</div>
                      <div className="text-[10px] text-zinc-400">9.3K views</div>
                    </div>
                    <span className="text-purple-400 font-bold">310 shares</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-2`}>
              <span className="text-xs font-bold uppercase text-zinc-400">Recent Activity Timeline</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-300">Reel reached 12,000 views milestone</span>
                  <span className="text-zinc-500 text-[10px]">2h ago</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-300">+24 new followers from suggested user list</span>
                  <span className="text-zinc-500 text-[10px]">5h ago</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-300">High engagement spike on Photo post</span>
                  <span className="text-zinc-500 text-[10px]">1d ago</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button 
                onClick={() => setShowFullDashboard(false)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow transition-colors"
              >
                Close Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Post Modal */}
      {user && (
        <CreatePostModal 
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          user={user}
          initialMode={createMode}
          onPostCreated={() => {
            if (user) fetchPosts(user.id);
          }}
        />
      )}

      {/* Edit Profile Modal */}
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
