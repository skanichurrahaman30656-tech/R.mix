"use client";
import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { VideoPlayer } from '../shared/VideoPlayer';
import { VolumeX, Volume2, Music, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

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
  user
}: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isActive = activeReelId === reelItem.id;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveReelId(reelItem.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reelItem.id, setActiveReelId]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isActive]);

  const isFollowing = followedUsers[reelItem.user_id] || followedUsers[reelItem.author] || false;
  const mediaList = typeof reelItem.media_url === "string" ? (() => { try { const p = JSON.parse(reelItem.media_url); return Array.isArray(p) ? p : [p]; } catch { return [reelItem.media_url]; } })() : reelItem.media_url || [];
  const mediaSrc = mediaList[0] || reelItem.image || 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1187-large.mp4';

  return (
    <div 
      ref={cardRef}
      key={reelItem.id} 
      className="snap-start h-full min-h-[540px] max-h-[720px] my-2 relative rounded-2xl overflow-hidden bg-black text-white flex flex-col justify-end p-4 border border-zinc-800 shadow-2xl group"
    >
      <VideoPlayer 
        ref={videoRef}
        src={mediaSrc} 
        className="absolute inset-0 w-full h-full object-cover z-0 cursor-pointer" 
        loop 
        muted={isReelsMuted} 
        playsInline 
        preload="metadata"
        onTimeUpdate={(e) => handleReelTimeUpdate(reelItem.id, (e.target as HTMLVideoElement).currentTime)}
        onClick={() => setIsReelsMuted(!isReelsMuted)}
        controls={false}
      />

      {/* Sound Indicator Badge Overlay */}
      <button 
        onClick={() => setIsReelsMuted(!isReelsMuted)}
        className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-2 text-xs font-semibold hover:bg-black/80 transition-all shadow-lg"
      >
        {isReelsMuted ? (
          <>
            <VolumeX className="w-4 h-4 text-red-400" />
            <span>Muted (Tap for Sound)</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Sound On</span>
          </>
        )}
      </button>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10 pointer-events-none" />

      {/* Left Bottom Details Overlay */}
      <div className="relative z-20 space-y-3 max-w-[80%]">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => openUserProfile(reelItem.user_id)} 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 shadow cursor-pointer hover:opacity-80"
          >
            <Image width={500} height={500} referrerPolicy="no-referrer" src={reelItem.avatar || "https://picsum.photos/seed/user/100/100"} alt="Reel Author" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div>
            <div 
              onClick={() => openUserProfile(reelItem.user_id)} 
              className="font-bold text-sm tracking-tight drop-shadow cursor-pointer hover:underline"
            >
              @{reelItem.author || 'creator'}
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

        <p className="text-xs sm:text-sm text-zinc-100 leading-snug drop-shadow line-clamp-2">
          {reelItem.caption || reelItem.content || 'Trending Reel'}
        </p>

        <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
          <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="truncate">Original Sound - @{reelItem.author || 'creator'}</span>
        </div>
      </div>

      {/* Right Sidebar Interactive Actions */}
      <div className="absolute right-3 bottom-12 z-20 flex flex-col items-center gap-5">
        
        {/* Sound Toggle */}
        <button 
          onClick={() => setIsReelsMuted(!isReelsMuted)}
          className="flex flex-col items-center group"
          title={isReelsMuted ? "Unmute Sound" : "Mute Sound"}
        >
          <div className={`p-3 rounded-full backdrop-blur-md border transition-colors ${isReelsMuted ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-black/40 border-white/10 text-white'}`}>
            {isReelsMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            {isReelsMuted ? "Unmute" : "Sound"}
          </span>
        </button>

        {/* Like */}
        <button 
          onClick={() => handleLike(reelItem.id, reelItem.isLiked)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
            <Heart className={`w-6 h-6 transition-transform group-active:scale-125 ${reelItem.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            {(reelItem.likes || 0).toLocaleString()}
          </span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => handleToggleComments(reelItem.id)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            {reelItem.commentsCount || 0}
          </span>
        </button>

        {/* Share */}
        <button 
          onClick={() => handleShare(reelItem.id)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
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
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 transition-colors">
            <Bookmark className={`w-6 h-6 transition-colors ${reelItem.isBookmarked ? 'fill-white text-white' : 'text-white'}`} />
          </div>
          <span className="text-[11px] font-bold mt-1 drop-shadow">
            Save
          </span>
        </button>

        {/* Music Disc */}
        <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-indigo-400 overflow-hidden flex items-center justify-center animate-spin mt-1" style={{ animationDuration: '6s' }}>
          <Music className="w-4 h-4 text-indigo-400" />
        </div>

      </div>
    </div>
  );
}
