"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play, Pause, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { VideoPlayer } from '../shared/VideoPlayer';

interface Story {
  id: string;
  author: string;
  avatar: string;
  media_url: string;
  isUser: boolean;
  type?: string;
  user_id?: string;
  created_at?: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  currentUser: any;
}

const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function StoryViewer({ stories, initialIndex, onClose, currentUser }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<{id: number, emoji: string, left: number}[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [replies, setReplies] = useState<any[]>([]);

  const story = stories[currentIndex];
  const isOwner = story.user_id === currentUser?.id || story.isUser;
  
  const STORY_DURATION = 5000;
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);
    setIsPaused(false);
    fetchReactionsAndReplies(story.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, story.id]);

  useEffect(() => {
    if (isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    if (story.type === 'video') {
      // For videos, progress is handled differently, wait for video to play
      return;
    }

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + (100 / (STORY_DURATION / 50));
      });
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPaused, story.type]);

  const fetchReactionsAndReplies = async (storyId: string) => {
    // Realtime subscription could be set up here, but we will just fetch initially
    try {
      const { data: reactionsData } = await supabase
        .from('story_reactions')
        .select('reaction')
        .eq('story_id', storyId);
        
      if (reactionsData) {
        const counts: Record<string, number> = {};
        reactionsData.forEach((r: any) => {
          counts[r.reaction] = (counts[r.reaction] || 0) + 1;
        });
        setReactionCounts(counts);
      }

      if (isOwner) {
        const { data: repliesData } = await supabase
          .from('story_replies')
          .select('id, message, profiles:user_id(username, avatar_url)')
          .eq('story_id', storyId)
          .order('created_at', { ascending: false });
        if (repliesData) setReplies(repliesData);
      }
    } catch (e) {
      console.error((e as any)?.message || e);
    }
  };

  useEffect(() => {
    const channel = supabase.channel(`story-${story.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_reactions', filter: `story_id=eq.${story.id}` }, () => {
        fetchReactionsAndReplies(story.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_replies', filter: `story_id=eq.${story.id}` }, () => {
        if (isOwner) fetchReactionsAndReplies(story.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id, isOwner]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReaction = async (reaction: string) => {
    if (!currentUser) return;
    
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji: reaction, left: 20 + Math.random() * 60 }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);

    // Optimistic update
    setReactionCounts(prev => ({...prev, [reaction]: (prev[reaction] || 0) + 1}));
    
    const { error: reactErr } = await supabase.from('story_reactions').insert({
      story_id: story.id,
      user_id: currentUser.id,
      reaction
    });
    if (reactErr) console.warn('Story reaction failed:', (reactErr as any)?.message);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !replyText.trim()) return;
    
    const text = replyText;
    setReplyText('');
    
    const { error: replyErr } = await supabase.from('story_replies').insert({
      story_id: story.id,
      user_id: currentUser.id,
      message: text
    });
    if (replyErr) console.warn('Story reply failed:', (replyErr as any)?.message);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white hover:bg-white/10 rounded-full"
      >
        <X className="w-6 h-6" />
      </button>

      <div 
        className="relative w-full max-w-[400px] h-[100dvh] sm:h-[80vh] sm:rounded-2xl overflow-hidden bg-zinc-900 flex flex-col"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
        onTouchStart={(e) => {
          setIsPaused(true);
          const touch = e.touches[0];
          e.currentTarget.setAttribute('data-starty', touch.clientY.toString());
        }}
        onTouchMove={(e) => {
          const startYStr = e.currentTarget.getAttribute('data-starty');
          if (startYStr) {
            const startY = parseFloat(startYStr);
            const diff = e.touches[0].clientY - startY;
            if (diff > 100) {
              onClose();
              e.currentTarget.removeAttribute('data-starty');
            }
          }
        }}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-4">
          {stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center gap-3 p-4">
          <Image 
            src={story.avatar} 
            alt={story.author} 
            width={40} 
            height={40} 
            className="rounded-full w-10 h-10 border-2 border-white/20" 
            referrerPolicy="no-referrer"
          />
          <span className="text-white font-semibold drop-shadow-md">{story.author}</span>
        </div>

        {/* Tap areas for navigation */}
        <div 
          className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        />
        <div 
          className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
        />

        {/* Floating Reactions */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          {floatingReactions.map(r => (
            <div 
              key={r.id} 
              className="absolute bottom-20 text-4xl animate-float-up opacity-0"
              style={{ left: `${r.left}%` }}
            >
              {r.emoji}
            </div>
          ))}
        </div>
        
        {/* Media */}
        <div className="flex-1 w-full h-full relative pointer-events-none">
          {(story.type === 'video' || (story.media_url && typeof story.media_url === 'string' && (story.media_url.match(/\.(mp4|webm|ogg|mov)$/i) || story.media_url.startsWith('data:video/')))) ? (
            <video
              src={story.media_url}
              className="w-full h-full object-cover"
              autoPlay
              controlsList="nodownload"
              playsInline
              onTimeUpdate={(e) => {
                const vid = e.target as HTMLVideoElement;
                if (!Number.isNaN(vid.duration)) {
                  setProgress((vid.currentTime / vid.duration) * 100);
                }
              }}
              onEnded={handleNext}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onError={(e) => {
                const vid = e.target as HTMLVideoElement;
                if (story.media_url !== 'https://www.w3schools.com/html/mov_bbb.mp4') {
                  vid.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
                  vid.load();
                  vid.play().catch(() => {});
                }
              }}
            />
          ) : (
            <Image
              src={story.media_url}
              alt="Story"
              fill
              className="object-cover"
              priority
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Footer (Reactions/Replies) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Reaction counts */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <div key={emoji} className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                  <span>{emoji}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}

          {!isOwner ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center gap-4 py-2 pointer-events-auto">
                {REACTIONS.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <form onSubmit={handleReply} className="flex gap-2 pointer-events-auto">
                <input
                  type="text"
                  placeholder="Reply to story..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-white/50 text-sm"
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                />
                <button type="submit" disabled={!replyText.trim()} className="p-2 bg-indigo-500 rounded-full text-white disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="pointer-events-auto max-h-40 overflow-y-auto">
              <h4 className="text-white/80 text-xs font-semibold mb-2">Replies</h4>
              {replies.length === 0 ? (
                <p className="text-white/50 text-xs">No replies yet.</p>
              ) : (
                <div className="space-y-2">
                  {replies.map(reply => (
                    <div key={reply.id} className="flex gap-2 items-start bg-black/40 p-2 rounded-lg">
                      <Image 
                        src={reply.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                        alt="Avatar" width={20} height={20} className="rounded-full" referrerPolicy="no-referrer"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-white/90 mr-1">{reply.profiles?.username}</span>
                        <span className="text-white">{reply.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
