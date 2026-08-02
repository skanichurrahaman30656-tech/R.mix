"use client";
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { 
  VolumeX, Volume2, Music, Heart, MessageCircle, Share2, Bookmark, Eye, 
  Play, Pause, RotateCcw, RotateCw, Settings, MoreVertical, Download, 
  Edit3, Trash2, Repeat, FileText, Globe, Sliders, HelpCircle, Star, 
  Sparkles, Smile, Image as ImageIcon, AtSign, Check, X, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

export function ReelCardItem({
  reelItem,
  activeReelId,
  setActiveReelId,
  isReelsMuted,
  setIsReelsMuted,
  handleReelTimeUpdate,
  toggleFollow,
  followedUsers,
  handleLike,
  handleShare,
  handleToggleComments,
  handleBookmark,
  openUserProfile,
  user,
  handleCommentChange,
  submitComment,
  handleDeletePost,
  setCreateMode,
  setShowCreatePost
}: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Player controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoNext, setAutoNext] = useState(true);

  // UI Modals & Menus
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showAudioLangModal, setShowAudioLangModal] = useState(false);
  const [showWhyThisModal, setShowWhyThisModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState(reelItem.caption || '');
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // Comment Drawer & Live Supabase comments
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>(reelItem.comments || []);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);
  const [showGifDropdown, setShowGifDropdown] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  // Metrics tracking
  const [watchTime, setWatchTime] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [rating, setRating] = useState(5);
  const [ratedSuccess, setRatedSuccess] = useState(false);

  // Animation & Feedback
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isActive = activeReelId === reelItem.id;
  const isOwner = user?.id === reelItem.user_id;
  const isFollowing = followedUsers[reelItem.user_id] || followedUsers[reelItem.author] || false;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch comments live from Supabase
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id ( id, username, avatar_url, full_name )
        `)
        .eq('post_id', reelItem.id)
        .order('created_at', { ascending: false });
      if (data) setComments(data);
    };
    fetchComments();
  }, [reelItem.id]);

  // Intersection Observer for autoplay & view count
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveReelId(reelItem.id);
            // Record view in live Supabase if user is logged in
            if (user) {
              supabase.from('post_views').upsert({
                post_id: reelItem.id,
                user_id: user.id
              }, { onConflict: 'post_id,user_id' }).then(() => {});
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reelItem.id, setActiveReelId, user]);

  // Video play/pause effect
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.playbackRate = playbackSpeed;
    vid.volume = isReelsMuted ? 0 : volume;

    if (isActive) {
      vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isActive, playbackSpeed, volume, isReelsMuted]);

  // Watch time timer when active
  useEffect(() => {
    let timer: any;
    if (isActive && isPlaying) {
      timer = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, isPlaying]);

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleRewind = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, vid.currentTime - 5);
  };

  const handleForward = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 5);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const newTime = (val / 100) * vid.duration;
    vid.currentTime = newTime;
    setProgress(val);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (!reelItem.isLiked) {
        handleLike(reelItem.id, reelItem.isLiked);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 1000);
    }
    setLastTap(now);
  };

  const handleSendComment = async () => {
    if (!user || !commentInput.trim()) return;
    const text = commentInput.trim();
    const { data, error } = await supabase.from('comments').insert({
      post_id: reelItem.id,
      user_id: user.id,
      content: text
    }).select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id ( id, username, avatar_url, full_name )
    `).single();

    if (!error && data) {
      setComments([data, ...comments]);
      setCommentInput('');
      triggerToast("Comment posted successfully!");
    } else {
      triggerToast("Error posting comment.");
    }
  };

  const handleDownloadReel = () => {
    const mediaList = typeof reelItem.media_url === "string" ? (() => { try { const p = JSON.parse(reelItem.media_url); return Array.isArray(p) ? p : [p]; } catch { return [reelItem.media_url]; } })() : reelItem.media_url || [];
    const url = mediaList[0] || reelItem.video_url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `rmix-reel-${reelItem.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast("Reel download started!");
  };

  const handleRemixThisReel = () => {
    if (setCreateMode && setShowCreatePost) {
      setCreateMode('reel');
      setShowCreatePost(true);
      triggerToast("Starting remix of this reel!");
    }
  };

  const handleDeleteThisReel = async () => {
    if (!confirm("Are you sure you want to delete this reel?")) return;
    if (handleDeletePost) {
      await handleDeletePost(reelItem.id);
    } else {
      await supabase.from('posts').delete().eq('id', reelItem.id);
    }
    triggerToast("Reel deleted successfully.");
  };

  const handleUpdateReelCaption = async () => {
    if (!isOwner) return;
    const { error } = await supabase.from('posts').update({ content: editCaptionText }).eq('id', reelItem.id);
    if (!error) {
      reelItem.caption = editCaptionText;
      setShowEditModal(false);
      triggerToast("Reel caption updated successfully!");
    } else {
      triggerToast("Failed to update caption.");
    }
  };

  const mediaList = typeof reelItem.media_url === "string" ? (() => { try { const p = JSON.parse(reelItem.media_url); return Array.isArray(p) ? p : [p]; } catch { return [reelItem.media_url]; } })() : reelItem.media_url || [];
  const mediaSrc = mediaList[0] || reelItem.image || reelItem.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1187-large.mp4';

  return (
    <div 
      ref={cardRef}
      key={reelItem.id} 
      className="snap-start h-full min-h-[560px] max-h-[740px] my-2 relative rounded-2xl overflow-hidden bg-black text-white flex flex-col justify-end p-4 border border-zinc-800 shadow-2xl group select-none"
      onClick={handleDoubleTap}
    >
      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600/90 backdrop-blur-md text-white font-bold text-xs rounded-full shadow-2xl border border-indigo-400/40 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Video Element */}
      <video 
        ref={videoRef}
        src={mediaSrc} 
        className="absolute inset-0 w-full h-full object-cover z-0 cursor-pointer" 
        loop 
        muted={isReelsMuted} 
        playsInline 
        preload="metadata"
        onTimeUpdate={(e) => {
          const vid = e.target as HTMLVideoElement;
          handleReelTimeUpdate(reelItem.id, vid.currentTime);
          setCurrentTime(vid.currentTime);
          if (vid.duration) {
            setDuration(vid.duration);
            const pct = (vid.currentTime / vid.duration) * 100;
            setProgress(pct);
            setCompletionRate(Math.round(pct));
          }
        }}
        onClick={togglePlayPause}
      />

      {/* Heart Pop Animation on Double Tap */}
      {showHeartPop && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-ping drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
        </div>
      )}

      {/* Top Header Overlays: Sound, Views, Settings, More */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Sound Toggle Badge */}
          <button 
            onClick={() => setIsReelsMuted(!isReelsMuted)}
            className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-2 text-xs font-semibold hover:bg-black/80 transition-all shadow-lg"
          >
            {isReelsMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Sound On</span>
              </>
            )}
          </button>

          {/* AI Content Label Badge */}
          <div className="px-2.5 py-1 rounded-full bg-indigo-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 flex items-center gap-1 text-[10px] font-bold shadow">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>AI Content</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Views & Metrics Badge */}
          <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 text-xs font-semibold shadow-lg">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>{(reelItem.views || 0).toLocaleString()} views</span>
          </div>

          {/* Playback Settings Button */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all shadow"
            title="Playback Settings"
          >
            <Settings className="w-4 h-4 text-zinc-300" />
          </button>

          {/* More (⋮) Menu Button */}
          <button 
            onClick={() => setShowMoreMenu(true)}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all shadow"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Center Play/Pause & Rewind/Forward Controls overlay on pause */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center gap-6 z-20 bg-black/30 backdrop-blur-[2px] pointer-events-auto">
          <button 
            onClick={handleRewind}
            className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 border border-white/20 shadow-xl transition-transform active:scale-95"
            title="5-second rewind"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button 
            onClick={togglePlayPause}
            className="p-5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl transition-transform active:scale-95 border border-indigo-400"
            title="Play / Pause"
          >
            <Play className="w-8 h-8 fill-white ml-0.5" />
          </button>
          <button 
            onClick={handleForward}
            className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 border border-white/20 shadow-xl transition-transform active:scale-95"
            title="5-second forward"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10 pointer-events-none" />

      {/* Left Bottom Details Overlay */}
      <div className="relative z-20 space-y-2.5 max-w-[78%] pointer-events-auto">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => openUserProfile(reelItem.user_id)} 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 shadow cursor-pointer hover:opacity-80 flex-shrink-0"
          >
            <Image width={100} height={100} referrerPolicy="no-referrer" src={reelItem.avatar || "https://picsum.photos/seed/user/100/100"} alt="Reel Author" className="w-full h-full object-cover" />
          </div>
          <div>
            <div 
              onClick={() => openUserProfile(reelItem.user_id)} 
              className="font-bold text-sm tracking-tight drop-shadow cursor-pointer hover:underline flex items-center gap-1.5"
            >
              <span>@{reelItem.author || 'creator'}</span>
              {reelItem.is_verified && <span className="text-indigo-400 text-xs">✓</span>}
            </div>
          </div>
          {reelItem.user_id !== user?.id && (
            <button 
              onClick={() => toggleFollow(reelItem.user_id || reelItem.author)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow ${
                isFollowing 
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Caption with Show More / Show Less */}
        <div className="text-xs sm:text-sm text-zinc-100 leading-snug drop-space">
          <p className={`${captionExpanded ? '' : 'line-clamp-2'}`}>
            {reelItem.caption || reelItem.content || 'Trending R.mix Reel'}
          </p>
          {(reelItem.caption || reelItem.content || '').length > 60 && (
            <button 
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="text-[11px] font-bold text-indigo-400 hover:underline mt-0.5 inline-block"
            >
              {captionExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>

        {/* Audio & Music Tag */}
        <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
          <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="truncate">Original Audio - @{reelItem.author || 'creator'}</span>
        </div>

        {/* Live Real-Time Analytics Bar (Watch Time & Completion Rate) */}
        <div className="flex items-center gap-3 pt-1 text-[10px] text-zinc-400 font-semibold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-fit">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Watch: {watchTime}s</span>
          </div>
          <div className="w-px h-3 bg-zinc-700" />
          <div className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold">{completionRate}%</span>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar Interactive Actions */}
      <div className="absolute right-3 bottom-12 z-20 flex flex-col items-center gap-4 pointer-events-auto">
        
        {/* Play/Pause Button */}
        <button 
          onClick={togglePlayPause}
          className="flex flex-col items-center group"
          title={isPlaying ? "Pause" : "Play"}
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:bg-black/80 transition-colors text-white">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </div>
          <span className="text-[10px] font-bold mt-1 drop-shadow">
            {isPlaying ? "Pause" : "Play"}
          </span>
        </button>

        {/* Like */}
        <button 
          onClick={() => handleLike(reelItem.id, reelItem.isLiked)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:bg-black/80 transition-colors">
            <Heart className={`w-6 h-6 transition-transform group-active:scale-125 ${reelItem.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            {(reelItem.likes || 0).toLocaleString()}
          </span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => setShowCommentDrawer(true)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:bg-black/80 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            {comments.length || reelItem.commentsCount || 0}
          </span>
        </button>

        {/* Share */}
        <button 
          onClick={() => handleShare(reelItem.id)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:bg-black/80 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            Share
          </span>
        </button>

        {/* Save */}
        <button 
          onClick={() => handleBookmark(reelItem.id, reelItem.isBookmarked)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:bg-black/80 transition-colors">
            <Bookmark className={`w-6 h-6 transition-colors ${reelItem.isBookmarked ? 'fill-white text-white' : 'text-white'}`} />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            Save
          </span>
        </button>

        {/* Music Spinning Disc */}
        <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-indigo-400 overflow-hidden flex items-center justify-center animate-spin mt-1 shadow-lg" style={{ animationDuration: '6s' }}>
          <Music className="w-4 h-4 text-indigo-400" />
        </div>

      </div>

      {/* Seekable Progress Bar at Very Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-800/80 z-30 pointer-events-auto group/bar cursor-pointer">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress} 
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div 
          className="h-full bg-indigo-500 transition-all duration-100 relative pointer-events-none" 
          style={{ width: `${progress}%` }} 
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform" />
        </div>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* 1. Playback Settings Modal */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Playback Settings</span>
              </h4>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Playback Speed</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <button 
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        playbackSpeed === speed 
                          ? 'bg-indigo-600 text-white shadow' 
                          : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Volume Control</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsReelsMuted(!isReelsMuted)} className="text-zinc-300">
                    {isReelsMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={isReelsMuted ? 0 : volume}
                    onChange={e => {
                      setVolume(parseFloat(e.target.value));
                      if (isReelsMuted) setIsReelsMuted(false);
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-white">Stop Auto Next Reel</div>
                  <div className="text-[10px] text-zinc-400">Prevent scrolling to next reel automatically</div>
                </div>
                <button 
                  onClick={() => setAutoNext(!autoNext)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${autoNext ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoNext ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* 2. More (⋮) Options Menu Modal */}
      {showMoreMenu && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xs p-3 space-y-1 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 px-2">
              <h4 className="font-bold text-sm text-white">Reel Options</h4>
              <button onClick={() => setShowMoreMenu(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-0.5 pt-1">
              <button 
                onClick={() => { setShowMoreMenu(false); handleDownloadReel(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download Reel</span>
              </button>

              <button 
                onClick={() => { setShowMoreMenu(false); handleRemixThisReel(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <Repeat className="w-4 h-4 text-emerald-400" />
                <span>Remix This Reel</span>
              </button>

              <button 
                onClick={() => { setShowMoreMenu(false); setShowTranscriptModal(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Transcript</span>
              </button>

              <button 
                onClick={() => { setShowMoreMenu(false); setShowAudioLangModal(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Audio & Language</span>
              </button>

              <button 
                onClick={() => { setShowMoreMenu(false); setShowWhyThisModal(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Why am I seeing this video</span>
              </button>

              <button 
                onClick={() => { setShowMoreMenu(false); setShowRateModal(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Rate playback experience</span>
              </button>

              {isOwner && (
                <>
                  <div className="border-t border-zinc-800 my-1 pt-1" />
                  <button 
                    onClick={() => { setShowMoreMenu(false); setShowEditModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900 text-xs font-semibold text-indigo-400 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Reel (Owner)</span>
                  </button>

                  <button 
                    onClick={() => { setShowMoreMenu(false); handleDeleteThisReel(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-xs font-semibold text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Reel (Owner)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Transcript Modal */}
      {showTranscriptModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Video Transcript</span>
              </h4>
              <button onClick={() => setShowTranscriptModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <p className="font-mono text-[11px] text-indigo-400">[00:00] Welcome to R.mix Reels experience.</p>
              <p className="font-mono text-[11px] text-zinc-300">[00:03] {reelItem.caption || reelItem.content || 'Showing high quality trending video content.'}</p>
              <p className="font-mono text-[11px] text-indigo-400">[00:15] End of automated transcript segment.</p>
            </div>
            <button onClick={() => setShowTranscriptModal(false)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white">
              Close Transcript
            </button>
          </div>
        </div>
      )}

      {/* 4. Audio & Language Modal */}
      {showAudioLangModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Audio & Language</span>
              </h4>
              <button onClick={() => setShowAudioLangModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-zinc-300">
              <div>
                <label className="font-bold text-white block mb-1">Original Audio Track</label>
                <p className="text-zinc-400">Original Audio by @{reelItem.author || 'creator'}</p>
              </div>
              <div>
                <label className="font-bold text-white block mb-1">Audio Language</label>
                <select className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs">
                  <option>English (Original)</option>
                  <option>Spanish (Auto-Dub)</option>
                  <option>French (Auto-Dub)</option>
                  <option>Hindi (Auto-Dub)</option>
                </select>
              </div>
            </div>
            <button onClick={() => { setShowAudioLangModal(false); triggerToast("Audio settings updated!"); }} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white">
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* 5. Why Am I Seeing This Video Modal */}
      {showWhyThisModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Why am I seeing this reel?</span>
              </h4>
              <button onClick={() => setShowWhyThisModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 leading-relaxed">
              <p>• You follow creators with similar interests or interact with similar Reels categories.</p>
              <p>• High engagement rate and completion rate among R.mix community members.</p>
              <p>• Trending in your country&apos;s active recommendations feed.</p>
            </div>
            <button onClick={() => setShowWhyThisModal(false)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white">
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 6. Rate Playback Experience Modal */}
      {showRateModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Rate Playback Experience</span>
              </h4>
              <button onClick={() => setShowRateModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                setShowRateModal(false);
                setRatedSuccess(true);
                triggerToast("Thank you for rating your playback experience!");
              }} 
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow"
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}

      {/* 7. Edit Reel Modal (Owner only) */}
      {showEditModal && isOwner && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Edit Reel Caption</span>
              </h4>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <textarea 
                value={editCaptionText}
                onChange={e => setEditCaptionText(e.target.value)}
                className="w-full h-24 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                placeholder="Update your reel caption..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-900 font-bold text-xs text-zinc-300">
                Cancel
              </button>
              <button onClick={handleUpdateReelCaption} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Live Comments Drawer / Modal */}
      {showCommentDrawer && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end pointer-events-auto animate-fadeIn">
          <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl w-full max-h-[75vh] flex flex-col shadow-2xl">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <span>Comments ({comments.length})</span>
              </h4>
              <button onClick={() => setShowCommentDrawer(false)} className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[45vh]">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
                      <Image width={80} height={80} referrerPolicy="no-referrer" src={c.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">@{c.profiles?.username || 'user'}</span>
                        <span className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-zinc-200 mt-1">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input with Emoji, GIF, Mention */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 space-y-2 relative">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                  placeholder="Add a comment with @mention, emoji..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={() => setShowEmojiDropdown(!showEmojiDropdown)}
                  className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  title="Insert Emoji"
                >
                  <Smile className="w-4 h-4 text-amber-400" />
                </button>
                <button 
                  onClick={() => setShowGifDropdown(!showGifDropdown)}
                  className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800 font-bold text-[10px]"
                  title="Insert GIF"
                >
                  GIF
                </button>
                <button 
                  onClick={() => setShowMentionDropdown(!showMentionDropdown)}
                  className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  title="Mention Creator"
                >
                  <AtSign className="w-4 h-4 text-indigo-400" />
                </button>
                <button 
                  onClick={handleSendComment}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  Post
                </button>
              </div>

              {/* Emoji Picker Popup */}
              {showEmojiDropdown && (
                <div className="absolute bottom-16 left-3 bg-zinc-900 border border-zinc-800 p-2.5 rounded-2xl shadow-2xl grid grid-cols-6 gap-2 z-50">
                  {['🔥', '❤️', '👏', '😂', '😍', '✨', '🚀', '💯', '🙌', '😎', '🎉', '🤩'].map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => { setCommentInput(prev => prev + emoji); setShowEmojiDropdown(false); }}
                      className="p-2 text-base hover:bg-zinc-800 rounded-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* GIF Picker Popup */}
              {showGifDropdown && (
                <div className="absolute bottom-16 left-16 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-2xl space-y-2 z-50 w-64">
                  <div className="text-[11px] font-bold text-zinc-400">Select Trending GIF</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['https://media.giphy.com/media/3o7TKSjRrfIPjeiOkM/giphy.gif', 'https://media.giphy.com/media/l0HlRnAWXxn0MhOBK/giphy.gif'].map((gifUrl, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => { setCommentInput(prev => prev + ` [GIF]`); setShowGifDropdown(false); }}
                        className="w-full h-20 relative rounded-xl overflow-hidden cursor-pointer hover:opacity-80 border border-zinc-800"
                      >
                        <Image 
                          fill 
                          referrerPolicy="no-referrer"
                          src={gifUrl} 
                          alt="GIF" 
                          className="object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mention Selector Popup */}
              {showMentionDropdown && (
                <div className="absolute bottom-16 left-32 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shadow-2xl space-y-1 z-50 w-48">
                  <div className="text-[10px] font-bold text-zinc-400 px-2 py-1">Mention Creator</div>
                  <button 
                    onClick={() => { setCommentInput(prev => prev + `@${reelItem.author || 'creator'} `); setShowMentionDropdown(false); }}
                    className="w-full text-left px-2 py-1.5 rounded-xl text-xs text-white hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <span className="font-bold">@{reelItem.author || 'creator'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
