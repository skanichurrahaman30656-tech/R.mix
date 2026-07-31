"use client";
import { ReelCardItem } from './reels/ReelCardItem';
import Image from "next/image";
import { VideoPlayer } from "./shared/VideoPlayer";
import { StoryViewer } from "./story/StoryViewer";
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
  Volume2, VolumeX, User, ArrowUpRight, BarChart3,
  Link as LinkIcon, MapPin, CheckCircle2, DollarSign, Star, Award, 
  Zap, Briefcase, Send
} from 'lucide-react';

import CreatePostModal from './shared/CreatePostModal';
import { FeedPage } from './feed/FeedPage';
import { SearchPage } from './search/SearchPage';
import { ReelsPage } from './reels/ReelsPage';
import EditProfileModal from './shared/EditProfileModal';
import { SettingsSystem } from "./settings/SettingsSystem";
import { compressImage } from '@/lib/compress';


export default function MainDashboardClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const postsRef = useRef(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  const [page, setPage] = useState(0);
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const POSTS_LIMIT = 5;
  const [stories, setStories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ profiles: any[]; posts: any[] }>({ profiles: [], posts: [] });
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  
  // Modals & Mode States
  const [showCreateChoiceModal, setShowCreateChoiceModal] = useState(false);
  const [createMode, setCreateMode] = useState<'photo' | 'video' | 'reel' | 'text'>('text');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'reels' | 'profile' | 'settings' | 'search'>('feed');
  const [profileTab, setProfileTab] = useState<'posts' | 'reels' | 'photos' | 'videos'>('posts');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'analytics' | 'content' | 'audience' | 'engagement' | 'monetization'>('overview');
  const [activeSettingToast, setActiveSettingToast] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [storyUploading, setStoryUploading] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  
  // Search & Reel States
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const [isReelsMuted, setIsReelsMuted] = useState(false);
  const [viewedReelIds, setViewedReelIds] = useState<Record<string, boolean>>({});
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<any>(null);
  const [viewingProfileStats, setViewingProfileStats] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  
  const storyInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !isLoadingMore && !loading) {
          setPage((p) => {
            fetchPosts(user?.id, p + 1, true);
            return p + 1;
          });
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMorePosts, isLoadingMore, loading, user]);

  
  const handleStoryClick = (storyId: string) => {
    const idx = stories.findIndex((s: any) => s.id === storyId);
    if (idx !== -1) setSelectedStoryIndex(idx);
  };
  const openUserProfile = async (targetUserId: string) => {
    if (!targetUserId) return;
    if (targetUserId === user?.id) {
      setViewingProfileUser(null);
      setViewMode('profile');
      return;
    }

    try {
      const { data: targetProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      const { count: fCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      const { count: ingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      setViewingProfileUser(targetProf || null);
      setViewingProfileStats({
        followers: fCount || 0,
        following: ingCount || 0
      });
      setViewMode('profile');
    } catch (err) {
      console.error('Error opening user profile:', err);
    }
  };

  // Load persistent recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rmix_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {
      setRecentSearches([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...recentSearches.filter(s => s !== cleanTerm)].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem('rmix_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const triggerSettingNotice = (title: string) => {
    setActiveSettingToast(`Opened ${title}`);
    setTimeout(() => setActiveSettingToast(null), 3000);
  };

  const fetchFollowData = async (userId: string) => {
    const { count: fCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: ingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    const { data: myFollowing } = await supabase
      .from('followers')
      .select('following_id, profiles:following_id(username)')
      .eq('follower_id', userId);

    const followMap: Record<string, boolean> = {};
    if (myFollowing) {
      myFollowing.forEach((item: any) => {
        followMap[item.following_id] = true;
        if (item.profiles?.username) {
          followMap[item.profiles.username] = true;
        }
      });
    }

    setFollowersCount(fCount || 0);
    setFollowingCount(ingCount || 0);
    setFollowedUsers(followMap);
  };

  const toggleFollow = async (targetUser: any) => {
    if (!user || !targetUser) return;
    const targetUserId = typeof targetUser === 'string' ? targetUser : targetUser?.id;
    const targetUsername = typeof targetUser === 'string' ? targetUser : targetUser?.username;
    if (!targetUserId && !targetUsername) return;

    const isFollowing = Boolean(
      (targetUsername && followedUsers[targetUsername]) || 
      (targetUserId && followedUsers[targetUserId])
    );

    setFollowedUsers(prev => {
      const next = { ...prev };
      if (targetUsername) next[targetUsername] = !isFollowing;
      if (targetUserId) next[targetUserId] = !isFollowing;
      return next;
    });

    if (targetUserId) {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .match({ follower_id: user.id, following_id: targetUserId });
      } else {
        await supabase
          .from('followers')
          .insert({ follower_id: user.id, following_id: targetUserId });

        await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            actor_id: user.id,
            type: 'follow'
          });
      }
    }

    fetchFollowData(user.id);
  };

  const fetchSuggestedUsers = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(6);

    if (error) console.error('Error fetching posts:', error);
    if (data) {
      setSuggestedUsers(data);
    }
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        read,
        created_at,
        post_id,
        actor:actor_id ( id, username, full_name, avatar_url )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotificationsList(data);
    }
  };

  const fetchStories = async (userId?: string) => {
    const { data } = await supabase
      .from('stories')
      .select(`
        id,
        media_url,
        type,
        user_id,
        created_at,
        profiles:user_id ( id, username, avatar_url )
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      const formatted = data.map((s: any) => {
        let mediaUrl = s.media_url;
        if (typeof s.media_url === 'string' && s.media_url.startsWith('[')) {
          try {
            mediaUrl = JSON.parse(s.media_url)[0];
          } catch (e) {}
        }
        return {
        id: s.id,
        author: s.profiles?.username || 'user',
        avatar: s.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
        hasUnseen: true,
        media_url: mediaUrl,
        type: s.type,
        user_id: s.user_id,
        created_at: s.created_at,
        isUser: s.profiles?.id === userId
      };
      });
      setStories(formatted);
    }
  };

  const fetchPosts = async (userId?: string, pageIndex = pageRef.current, isLoadMore = false, forceRefresh = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else if (postsRef.current.length === 0) setLoading(true);

    if (forceRefresh) { pageIndex = 0; setPage(0); }
    const from = isLoadMore ? pageIndex * POSTS_LIMIT : 0;
    const to = isLoadMore ? ((pageIndex + 1) * POSTS_LIMIT) - 1 : ((pageIndex + 1) * POSTS_LIMIT) - 1;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id ( id, username, full_name, avatar_url ),
        likes ( user_id ),
        comments ( id, content, created_at, profiles:user_id ( id, username, avatar_url ) ),
        saved_posts ( user_id )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase Error:", error);
    }

    console.log("Fetched Posts:", data);

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
          handle: `@${p.profiles?.username || 'user'}`,
          avatar: p.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
          image: mediaList[0] || null,
          video_url: p.video_url,
          media_url: p.media_url,
          image_url: p.image_url,
          media_urls: mediaList,
          type: p.media_type || p.type,
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
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const uid = session.user.id;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      setProfile(data);

      fetchPosts(uid);
      fetchStories(uid);
      fetchFollowData(uid);
      fetchSuggestedUsers(uid);
      fetchNotifications(uid);
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
          fetchPosts(session.user.id);
          fetchFollowData(session.user.id);
          fetchSuggestedUsers(session.user.id);
          fetchNotifications(session.user.id);
        } else {
          setProfile(null);
          router.push('/login');
        }
      }
    );

    const channel = supabase.channel("public:stories").on("postgres_changes", { event: "INSERT", schema: "public", table: "stories" }, () => { fetchStories(user?.id); }).subscribe(); return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Real-time Subscriptions Setup
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        fetchPosts(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchPosts(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_posts' }, () => {
        fetchPosts(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followers' }, () => {
        fetchFollowData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications(user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Search logic querying Supabase
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ profiles: [], posts: [] });
      return;
    }

    const delay = setTimeout(async () => {
      setSearchLoading(true);
      const query = searchQuery.trim();

      // Query profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(10);

      // Query posts
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id ( id, username, full_name, avatar_url )
        `)
        .or(`content.ilike.%${query}%`)
        .limit(10);

      setSearchResults({
        profiles: profData || [],
        posts: postData || []
      });
      setSearchLoading(false);
      saveRecentSearch(query);
    }, 300);

    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setStoryUploading(true);
    try {
      let finalFile = file;
      let type = 'image';
      const isVideo = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
      const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);

      if (!isVideo && !isImage) {
        alert("Unsupported file type. Allowed types: JPG, PNG, WEBP, MP4, MOV, WEBM.");
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        alert("File exceeds the 100MB limit.");
        return;
      }

      if (isImage) {
        finalFile = await compressImage(file, 1080);
      } else if (isVideo) {
        type = 'video';
      }

      const fileExt = finalFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, finalFile, { upsert: false });

      let publicUrl = '';
      if (uploadError) {
        console.warn('Storage error, falling back to base64', uploadError.message);
        publicUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(finalFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      } else if (uploadData) {
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(uploadData.path);
        publicUrl = data.publicUrl;
      }

      const { error: storyErr } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url: publicUrl,
        type: type
      });
      if (storyErr) console.warn('Story insert failed:', (storyErr as any)?.message);

      fetchStories(user.id);
    } catch (error) {
      console.error("Story upload error:", (error as any)?.message || error);
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
    if (!user || !id) return;
    
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === id) {
        const curLikes = typeof post.likes === 'number' ? post.likes : 0;
        return {
          ...post,
          isLiked: !isLiked,
          likes: isLiked ? Math.max(curLikes - 1, 0) : curLikes + 1
        };
      }
      return post;
    }));

    if (isLiked) {
      await supabase.from('likes').delete().match({ post_id: id, user_id: user.id });
    } else {
      const { error: likeErr } = await supabase.from('likes').insert({ post_id: id, user_id: user.id });
      if (likeErr) console.warn('Like insert failed:', (likeErr as any)?.message);

      const targetPost = posts.find(p => p.id === id);
      if (targetPost && targetPost.user_id !== user.id) {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: targetPost.user_id,
          actor_id: user.id,
          type: 'like',
          post_id: id
        });
        if (notifErr) console.warn('Notification insert failed:', (notifErr as any)?.message);
      }
    }
  };

  const handleBookmark = async (id: string, isBookmarked: boolean) => {
    if (!user || !id) return;

    setPosts(prevPosts => prevPosts.map(post => 
      post.id === id ? { ...post, isBookmarked: !isBookmarked } : post
    ));

    if (isBookmarked) {
      await supabase.from('saved_posts').delete().match({ post_id: id, user_id: user.id });
    } else {
      const { error: saveErr } = await supabase.from('saved_posts').insert({ post_id: id, user_id: user.id });
      if (saveErr) console.warn('Save post failed:', (saveErr as any)?.message);
    }
  };

  
  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}?post=${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          url: url
        });
        setActiveSettingToast('Shared successfully');
        setTimeout(() => setActiveSettingToast(null), 2000);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setActiveSettingToast('Link copied to clipboard');
      setTimeout(() => setActiveSettingToast(null), 2000);
    }
  };

  const handleToggleComments = (id: string) => {
    if (!id) return;
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === id ? { ...post, showComments: !post.showComments } : post
    ));
  };

  const handleCommentChange = (id: string, text: string) => {
    if (!id) return;
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === id ? { ...post, newComment: text } : post
    ));
  };

  const submitComment = async (id: string, content: string) => {
    if (!user || !id || !content?.trim()) return;

    const { data, error: commentError } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: content.trim()
    }).select('id, content, created_at, profiles:user_id ( id, username, avatar_url )').single();

    if (data) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === id) {
          const existingComments = Array.isArray(post.comments) ? post.comments : [];
          return {
            ...post,
            comments: [...existingComments, data],
            commentsCount: (post.commentsCount || existingComments.length) + 1,
            newComment: ''
          };
        }
        return post;
      }));

      const targetPost = posts.find(p => p.id === id);
      if (targetPost && targetPost.user_id !== user.id) {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: targetPost.user_id,
          actor_id: user.id,
          type: 'comment',
          post_id: id
        });
    if (commentError) { console.warn('Comment insert failed:', (commentError as any)?.message); }
        if (notifErr) console.warn('Notification insert failed:', (notifErr as any)?.message);
      }
    }
  };

  const handleReelTimeUpdate = (reelId: string, currentTime: number) => {
    if (!reelId) return;
    if (currentTime > 3 && !viewedReelIds[reelId]) {
      setViewedReelIds(prev => ({ ...prev, [reelId]: true }));
      supabase.from("post_views").insert({ post_id: reelId, user_id: user?.id }).then((res) => {
        if (res.error) console.warn('Post view insert failed:', (res.error as any)?.message);
      });
      setPosts(prev => prev.map(p => p.id === reelId ? { ...p, views: (p.views || 0) + 1 } : p));
    }
  };

  // Direct Messages submit
  const handleSendMessage = async () => {
    if (!user || !selectedChatUser || !newMessageText.trim()) return;

    const { data, error: msgErr } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedChatUser.id,
      content: newMessageText.trim()
    }).select('*').single();
    if (msgErr) console.warn('Message insert failed:', (msgErr as any)?.message);

    if (data) {
      setMessagesList(prev => [...prev, data]);
      setNewMessageText('');
    }
  };

  // Extract real trending hashtags from database posts
  const realTrendingHashtags = Array.from(
    new Set(
      posts
        .flatMap(p => (p.caption || '').match(/#[a-zA-Z0-9_]+/g) || [])
    )
  ).slice(0, 6);

  // Filtered User Posts for Profile Page
  const userOwnPosts = posts.filter(p => p.user_id === user?.id);

  const profileTabFilteredPosts = userOwnPosts.filter(p => {
    if (profileTab === 'reels') return p.type === 'reel' || p.type === 'video';
    if (profileTab === 'videos') return p.type === 'video' || p.type === 'reel';
    if (profileTab === 'photos') return p.type === 'photo' || p.type === 'image' || (!p.type && p.image);
    return true;
  });

  // Dedicated Reels Feed from database only
  const reelsFeed = posts.filter(p => p.type === 'reel' || p.type === 'video');

  // Real Computed User Analytics for Professional Dashboard
  const totalUserPostsCount = userOwnPosts.length;
  const totalUserLikesCount = userOwnPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalUserCommentsCount = userOwnPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
  const totalUserViewsCount = userOwnPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  
  const estimatedReachCount = new Set(userOwnPosts.flatMap(p => (p.post_views || []).map((v: any) => v.user_id))).size;
  const userEngagementRate = totalUserViewsCount > 0 ? (((totalUserLikesCount + totalUserCommentsCount) / totalUserViewsCount) * 100).toFixed(1) : "0.0";
  const estimatedEarnings = "0.00";

  return (
    <div className={`min-h-screen font-sans pb-16 sm:pb-0 transition-colors duration-200 ${isDarkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-zinc-100 text-zinc-900'}`}>
      
      {/* Toast Notification */}
      {activeSettingToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{activeSettingToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 z-40 border-b transition-colors ${isDarkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'} backdrop-blur-md`}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* R.MIX Brand Logo (Tapping logo returns to global home feed) */}
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
                <button onClick={() => setShowNotificationsModal(true)} className="hover:opacity-70 transition-opacity relative">
                  <Heart className={`w-6 h-6 ${isDarkMode ? 'text-zinc-50' : 'text-zinc-900'}`} />
                  {notificationsList.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-zinc-950 animate-pulse" />
                  )}
                </button>
                <button onClick={() => setShowMessagesModal(true)} className="hover:opacity-70 transition-opacity">
                  <MessageCircle className={`w-6 h-6 ${isDarkMode ? 'text-zinc-50' : 'text-zinc-900'}`} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto py-2">
        
        {/* ==================== VIEW MODE 1: GLOBAL HOME FEED ==================== */}
        {viewMode === 'feed' && (
          <FeedPage
            posts={posts}
            hasMorePosts={hasMorePosts}
            isLoadingMore={isLoadingMore}
            loadMoreRef={loadMoreRef}
            isDarkMode={isDarkMode}
            user={user}
            profile={profile}
            followedUsers={followedUsers}
            storyUploading={storyUploading}
            storyInputRef={storyInputRef}
            handleLike={handleLike}
            handleToggleComments={handleToggleComments}
            handleShare={handleShare}
            handleBookmark={handleBookmark}
            toggleFollow={toggleFollow}
            openUserProfile={openUserProfile}
            handleCommentChange={handleCommentChange}
            submitComment={submitComment}
            stories={stories}
            handleStoryClick={handleStoryClick}
          />
        )}
        {/* ==================== VIEW MODE 2: DEDICATED SEARCH PAGE ==================== */}
        {viewMode === 'search' && (
          <SearchPage
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchLoading={searchLoading}
            searchResults={searchResults}
            recentSearches={recentSearches}
            setRecentSearches={setRecentSearches}
            realTrendingHashtags={realTrendingHashtags}
            suggestedUsers={suggestedUsers}
            followedUsers={followedUsers}
            toggleFollow={toggleFollow}
            isDarkMode={isDarkMode}
          />
        )}
        {/* ==================== VIEW MODE 3: DEDICATED REELS PAGE ==================== */}
        {viewMode === 'reels' && (
          <ReelsPage
            reelsFeed={reelsFeed}
            setCreateMode={setCreateMode}
            setShowCreatePost={setShowCreatePost}
            activeReelId={activeReelId}
            setActiveReelId={setActiveReelId}
            isReelsMuted={isReelsMuted}
            setIsReelsMuted={setIsReelsMuted}
            handleReelTimeUpdate={handleReelTimeUpdate}
            toggleFollow={toggleFollow}
            followedUsers={followedUsers}
            handleLike={handleLike}
            handleShare={handleShare}
            handleToggleComments={handleToggleComments}
            handleBookmark={handleBookmark}
            openUserProfile={openUserProfile}
            user={user}
          />
        )}
        {/* ==================== VIEW MODE 4: CREATOR PROFILE PAGE ==================== */}
        {viewMode === 'profile' && (() => {
          const isOwner = !viewingProfileUser || viewingProfileUser.id === user?.id;
          const displayProf = isOwner ? profile : viewingProfileUser;
          const displayUserPosts = posts.filter(p => p.user_id === displayProf?.id);
          const displayFilteredPosts = displayUserPosts.filter(p => {
            if (profileTab === 'reels') return p.type === 'reel' || p.type === 'video';
            if (profileTab === 'videos') return p.type === 'video' || p.type === 'reel';
            if (profileTab === 'photos') return p.type === 'photo' || p.type === 'image' || (!p.type && p.image);
            return true;
          });
          const displayFollowers = isOwner ? followersCount : viewingProfileStats.followers;
          const displayFollowing = isOwner ? followingCount : viewingProfileStats.following;
          const displayPostsCount = displayUserPosts.length;
          const displayTotalViews = isOwner ? totalUserViewsCount : 0;
          const isFollowingThisUser = followedUsers[displayProf?.id] || followedUsers[displayProf?.username] || false;

          return (
            <div className="pb-8 space-y-5">
              
              {/* 1) Large Cover Banner at the top */}
              <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl group">
                {displayProf?.cover_url ? (
                  <Image width={500} height={500} 
                    referrerPolicy="no-referrer" 
                    src={displayProf.cover_url} 
                    alt="Profile Banner" 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-indigo-950 via-purple-900 to-zinc-950 relative flex items-end p-5">
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:20px_20px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <span className="text-xs font-bold text-indigo-300 relative z-10 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-indigo-500/30 flex items-center gap-1.5 shadow">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Official Creator Cover</span>
                    </span>
                  </div>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="absolute top-3.5 right-3.5 p-2.5 bg-black/70 hover:bg-black/90 rounded-full text-white backdrop-blur-md transition-all border border-white/20 shadow-lg hover:scale-105"
                    title="Edit Cover Banner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 2) Profile Photo Overlapping Banner & Details */}
              <div className="px-4 space-y-3">
                <div className="flex items-end justify-between -mt-12 sm:-mt-16 relative z-10">
                  {/* Overlapping Profile Photo */}
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-[3px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-2xl ring-4 ring-zinc-950">
                      <Image width={500} height={500} 
                        referrerPolicy="no-referrer" 
                        src={displayProf?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
                        alt="Profile Avatar" 
                        className="w-full h-full object-cover rounded-full bg-zinc-900" 
                      />
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => setShowEditProfile(true)}
                        className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-all border border-zinc-950"
                        title="Change Photo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Account Type Badge */}
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-sm flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    <span>Creator Account</span>
                  </span>
                </div>

              {/* Display Name, Username, Verification Badge, Bio, Website, Location */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                      {displayProf?.full_name || displayProf?.username || 'Member Name'}
                    </h1>
                    {displayProf?.is_verified && (
                      <span className="inline-flex items-center text-blue-500" title="Verified Creator Account">
                        <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-indigo-400 mt-0.5">
                    @{displayProf?.username || 'user'}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  {displayProf?.bio || '✨ Digital creator & media enthusiast.'}
                </p>

                {/* Website & Location */}
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 pt-1 flex-wrap">
                  {displayProf?.website && (
                    <a 
                      href={displayProf.website.startsWith('http') ? displayProf.website : `https://${displayProf.website}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-indigo-400 hover:underline font-semibold"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[180px]">{displayProf.website}</span>
                    </a>
                  )}

                  {displayProf?.location && (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{displayProf.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3) Real Statistics Row */}
              <div className={`p-3.5 rounded-2xl border grid ${isOwner ? 'grid-cols-4' : 'grid-cols-3'} gap-1 text-center shadow-sm ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="px-1">
                  <div className="font-extrabold text-base sm:text-lg text-zinc-100">{displayPostsCount}</div>
                  <div className="text-[11px] text-zinc-400 font-medium tracking-tight">Posts</div>
                </div>
                <div className="border-l border-zinc-800/80 px-1">
                  <div className="font-extrabold text-base sm:text-lg text-zinc-100">{displayFollowers}</div>
                  <div className="text-[11px] text-zinc-400 font-medium tracking-tight">Followers</div>
                </div>
                <div className="border-l border-zinc-800/80 px-1">
                  <div className="font-extrabold text-base sm:text-lg text-zinc-100">{displayFollowing}</div>
                  <div className="text-[11px] text-zinc-400 font-medium tracking-tight">Following</div>
                </div>
                {isOwner && (
                  <div className="border-l border-zinc-800/80 px-1">
                    <div className="font-extrabold text-base sm:text-lg text-indigo-400">{displayTotalViews}</div>
                    <div className="text-[11px] text-zinc-400 font-medium tracking-tight">Total Views</div>
                  </div>
                )}
              </div>

              {/* 4) Edit Profile Button (Owner) OR Follow Button (Visitor) */}
              {isOwner ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowEditProfile(true)} 
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-sm flex items-center justify-center gap-2 ${
                      isDarkMode 
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800 active:scale-[0.99]' 
                        : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>Edit Profile</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('settings')} 
                    className={`py-2.5 px-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-sm ${
                      isDarkMode 
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800 active:scale-[0.99]' 
                        : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
                    }`}
                    title="Settings & Privacy"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleFollow(displayProf?.id)} 
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-sm flex items-center justify-center gap-2 ${
                      isFollowingThisUser 
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isFollowingThisUser ? 'Following' : 'Follow'}</span>
                  </button>
                </div>
              )}

              {/* 5) Large Professional Dashboard Card (ONLY FOR OWNER) */}
              {isOwner && (
                <div 
                  onClick={() => setShowFullDashboard(true)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow-lg relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-indigo-950/70 via-zinc-900 to-zinc-950 border-indigo-500/30 hover:border-indigo-500/70' 
                      : 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 border-indigo-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                        <BarChart2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                          <span>Professional Dashboard</span>
                          <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">Pro</span>
                        </h2>
                        <p className="text-[11px] text-zinc-400">Insights, Monetization & Audience Growth</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-3">
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Views</div>
                      <div className="text-sm font-extrabold text-indigo-400">{totalUserViewsCount}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Reach</div>
                      <div className="text-sm font-extrabold text-purple-400">{estimatedReachCount}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Engagement</div>
                      <div className="text-sm font-extrabold text-emerald-400">{userEngagementRate}%</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Earnings</div>
                      <div className="text-sm font-extrabold text-amber-400">${estimatedEarnings}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6) Keep Tabs: Posts | Reels | Photos | Videos */}
              <div className={`border-t border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'} pt-1`}>
                <div className="flex justify-around">
                  <button 
                    onClick={() => setProfileTab('posts')}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
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
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
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
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                      profileTab === 'photos' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Photos</span>
                  </button>

                  <button 
                    onClick={() => setProfileTab('videos')}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                      profileTab === 'videos' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Videos</span>
                  </button>
                </div>
              </div>

              {/* 7) Media Grid */}
              {displayFilteredPosts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  No items found in {profileTab}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {displayFilteredPosts.map((p) => {
                    const mediaList = typeof p.media_url === "string" ? (() => { try { const parsed = JSON.parse(p.media_url); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return [p.media_url]; } })() : p.media_url || [];
                    const mediaSrc = mediaList[0] || p.image;
                    return (
                      <div key={p.id} className="aspect-square bg-zinc-900 relative rounded-xl overflow-hidden group cursor-pointer border border-zinc-800/50 shadow-sm">
                        {p.type === 'video' || p.type === 'reel' ? (
                          <VideoPlayer src={mediaSrc} className="w-full h-full" autoPlay muted={false} controls playsInline />
                        ) : mediaSrc ? (
                          <Image width={500} height={500} referrerPolicy="no-referrer" src={mediaSrc} alt="Post item" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-xs text-zinc-300 text-center bg-zinc-900 font-medium">
                            {p.caption?.substring(0, 35) || 'Text post'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold backdrop-blur-[2px]">
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-white" /> {p.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 fill-white" /> {p.commentsCount || 0}</span>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}

            </div>
          </div>
        );
      })()}

        {/* ==================== VIEW MODE 5: SETTINGS PAGE ==================== */}

        {viewMode === 'settings' && (
          <SettingsSystem 
            user={user} 
            onClose={() => setViewMode('profile')} 
            onLogout={handleLogout} 
          />
        )}
      
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 w-full border-t z-40 transition-colors ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="max-w-xl mx-auto px-6 h-12 flex items-center justify-between">
          
          {/* Home button always returns to global feed */}
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

          {/* Search button opens dedicated Search page */}
          <button 
            onClick={() => setViewMode('search')} 
            className={`hover:opacity-70 transition-opacity ${viewMode === 'search' ? 'opacity-100 text-indigo-400' : 'opacity-50'}`}
            title="Search"
          >
            <Search className="w-7 h-7" />
          </button>

          {/* Plus button opens 4 post creator choices */}
          <button 
            onClick={() => setShowCreateChoiceModal(true)} 
            className="hover:opacity-70 transition-opacity opacity-70 hover:opacity-100 text-indigo-400"
            title="Create Post"
          >
            <PlusSquare className="w-7 h-7" />
          </button>

          {/* Reels button opens dedicated Reels page */}
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
            <Image width={500} height={500} referrerPolicy="no-referrer" src={profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </nav>

      {/* CREATE CHOICE MODAL */}
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

      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span>Activity & Notifications</span>
              </h3>
              <button onClick={() => setShowNotificationsModal(false)} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {notificationsList.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">No notifications yet</div>
              ) : (
                notificationsList.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center gap-3">
                    <Image width={500} height={500} referrerPolicy="no-referrer" src={item.actor?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="User" className="w-9 h-9 rounded-full object-cover border border-zinc-700" />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-white">@{item.actor?.username || 'user'}</span>{' '}
                      <span className="text-zinc-300">
                        {item.type === 'like' && 'liked your post.'}
                        {item.type === 'comment' && 'commented on your post.'}
                        {item.type === 'follow' && 'started following you.'}
                      </span>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES MODAL */}
      {showMessagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-400" />
                <span>Direct Messages</span>
              </h3>
              <button onClick={() => setShowMessagesModal(false)} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedChatUser ? (
              <div className="overflow-y-auto flex-1 space-y-2">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Select a Creator to Chat</div>
                {suggestedUsers.map(su => (
                  <div 
                    key={su.id} 
                    onClick={() => setSelectedChatUser(su)}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3 cursor-pointer hover:bg-zinc-800/80 transition-colors"
                  >
                    <Image width={500} height={500} referrerPolicy="no-referrer" src={su.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="User" className="w-9 h-9 rounded-full object-cover border border-zinc-700" />
                    <div>
                      <div className="font-bold text-xs">{su.full_name || su.username}</div>
                      <div className="text-[11px] text-indigo-400">@{su.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Image width={500} height={500} referrerPolicy="no-referrer" src={selectedChatUser.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="User" className="w-7 h-7 rounded-full" />
                    <span className="font-bold text-xs">@{selectedChatUser.username}</span>
                  </div>
                  <button onClick={() => setSelectedChatUser(null)} className="text-xs text-indigo-400 font-semibold hover:underline">Change</button>
                </div>

                <div className="flex-1 min-h-[180px] p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 overflow-y-auto space-y-2">
                  {messagesList.length === 0 ? (
                    <div className="text-center text-xs text-zinc-500 py-6">No previous messages. Send a message to start conversation!</div>
                  ) : (
                    messagesList.map(msg => (
                      <div key={msg.id} className={`p-2 rounded-xl text-xs max-w-[80%] ${msg.sender_id === user?.id ? 'bg-indigo-600 ml-auto text-white' : 'bg-zinc-800 text-zinc-200'}`}>
                        {msg.content}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-white placeholder-zinc-500"
                  />
                  <button onClick={handleSendMessage} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROFESSIONAL DASHBOARD DEDICATED PAGE MODAL */}
      {showFullDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-3xl max-h-[92vh] rounded-3xl border space-y-5 overflow-y-auto shadow-2xl my-auto p-4 sm:p-6 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 sticky top-0 bg-zinc-950/95 backdrop-blur z-20 pt-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                    <span>Professional Dashboard</span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                      Active Creator
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">Real-time database analytics, content growth & monetization</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFullDashboard(false)} 
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Close Dashboard"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Dashboard Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-zinc-800/80 no-scrollbar">
              <button
                onClick={() => setDashboardTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  dashboardTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setDashboardTab('analytics')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  dashboardTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setDashboardTab('content')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  dashboardTab === 'content'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Content</span>
              </button>

              <button
                onClick={() => setDashboardTab('audience')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  dashboardTab === 'audience'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Audience</span>
              </button>

              <button
                onClick={() => setDashboardTab('engagement')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  dashboardTab === 'engagement'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Engagement</span>
              </button>

              <button
                onClick={() => setDashboardTab('monetization')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  dashboardTab === 'monetization'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Monetization</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {dashboardTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold uppercase">Total Views</span>
                    <div className="text-xl font-black text-indigo-400">{totalUserViewsCount}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold uppercase">Reach</span>
                    <div className="text-xl font-black text-purple-400">{estimatedReachCount}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold uppercase">Engagement</span>
                    <div className="text-xl font-black text-emerald-400">{userEngagementRate}%</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold uppercase">Est. Earnings</span>
                    <div className="text-xl font-black text-amber-400">${estimatedEarnings}</div>
                  </div>
                </div>

                {/* Performance Curve */}
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Account Performance Curve</h3>
                      <p className="text-xs text-zinc-400">Content impressions across uploaded posts</p>
                    </div>
                  </div>
                  {userOwnPosts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-500">Upload posts to see your performance curve.</div>
                  ) : (
                    <div className="h-28 flex items-end gap-2 pt-4 px-1">
                      {userOwnPosts.map((p, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div 
                            className="w-full bg-gradient-to-t from-indigo-600 to-purple-400 rounded-t transition-all group-hover:brightness-125"
                            style={{ height: `${Math.min(Math.max((p.views / (totalUserViewsCount || 1)) * 100, 15), 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ANALYTICS */}
            {dashboardTab === 'analytics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-indigo-400 uppercase tracking-wider">Database Analytics Metrics</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Total Posts</span> <Grid className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-lg font-black text-white">{totalUserPostsCount}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Views</span> <Eye className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="text-lg font-black text-white">{totalUserViewsCount}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Likes</span> <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400/20" />
                    </div>
                    <div className="text-lg font-black text-white">{totalUserLikesCount}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Comments</span> <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="text-lg font-black text-white">{totalUserCommentsCount}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Followers</span> <Users className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-lg font-black text-white">{followersCount}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Following</span> <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-lg font-black text-white">{followingCount}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Engagement Rate</span> <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-lg font-black text-white">{userEngagementRate}%</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Estimated Earnings</span> <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-lg font-black text-white">${estimatedEarnings}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTENT */}
            {dashboardTab === 'content' && (
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase text-indigo-400 tracking-wider">Your Creator Uploads</h3>
                {userOwnPosts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-500">No content uploaded yet.</div>
                ) : (
                  <div className="space-y-2">
                    {userOwnPosts.map(p => (
                      <div key={p.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <Image width={500} height={500} referrerPolicy="no-referrer" src={p.image} alt="Media" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-bold">TXT</div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white line-clamp-1">{p.caption || 'Untitled Post'}</div>
                            <div className="text-[10px] text-zinc-400">{p.type} • {p.likes} likes • {p.commentsCount} comments</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-400">{p.views} Views</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AUDIENCE */}
            {dashboardTab === 'audience' && (
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase text-indigo-400 tracking-wider">Audience & Community Stats</h3>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Total Account Followers</span>
                    <span className="font-bold text-white">{followersCount}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Total Following</span>
                    <span className="font-bold text-white">{followingCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ENGAGEMENT */}
            {dashboardTab === 'engagement' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <Heart className="w-5 h-5 text-red-400 mx-auto mb-1 fill-red-400/20" />
                    <div className="text-lg font-black">{totalUserLikesCount}</div>
                    <div className="text-[10px] text-zinc-400">Total Likes Received</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <MessageCircle className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                    <div className="text-lg font-black">{totalUserCommentsCount}</div>
                    <div className="text-[10px] text-zinc-400">Total Comments Received</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center col-span-2 sm:col-span-1">
                    <Activity className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-lg font-black">{userEngagementRate}%</div>
                    <div className="text-[10px] text-zinc-400">Engagement Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: MONETIZATION */}
            {dashboardTab === 'monetization' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 border border-emerald-500/40 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Calculated Creator Revenue
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">${estimatedEarnings}</div>
                  <p className="text-xs text-zinc-400">Based on real content views and viewer interactions from Supabase database.</p>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <button 
                onClick={() => setShowFullDashboard(false)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-all"
              >
                Close Professional Dashboard
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
          onPostCreated={(newPost) => {
            if (newPost) {
              const formattedNewPost = {
                id: newPost.id,
                author: newPost.profiles?.username || newPost.profiles?.full_name || 'Creator',
                handle: `@${newPost.profiles?.username || 'user'}`,
                avatar: newPost.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
                image: (typeof newPost.media_url === 'string' && newPost.media_url.startsWith('[')) ? JSON.parse(newPost.media_url)[0] : newPost.media_url,
                video_url: newPost.video_url,
                media_url: newPost.media_url,
                image_url: newPost.image_url,
                type: newPost.type,
                likes: 0,
                comments: [],
                commentsCount: 0,
                caption: newPost.content,
                views: 0,
                isLiked: false,
                isBookmarked: false,
                showComments: false,
                newComment: '',
                user_id: newPost.user_id,
                created_at: newPost.created_at
              };
              setPosts(prev => [formattedNewPost, ...prev]);
            }
            
          }}
        />
      )}

      {/* Edit Profile Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
          currentUser={user}
        />
      )}
      {user && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          user={user}
          profile={profile}
          onProfileUpdated={() => {
            fetchPosts(user.id);
            supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
          }}
        />
      )}


    </div>
  );
}
