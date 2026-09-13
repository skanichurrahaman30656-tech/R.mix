"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Heart, MessageCircle, Eye, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';

interface PostDetailClientProps {
  post: {
    id: string;
    content: string;
    media_url: string;
    type: string;
    created_at: string;
    updated_at: string;
    views_count?: number;
    likes_count?: number;
    post_views?: any[];
  };
  author?: {
    id?: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  siteUrl: string;
}

export default function PostDetailClient({
  post,
  author,
  videoUrl,
  imageUrl,
  siteUrl,
}: PostDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);

  const postUrl = `${siteUrl}/post/${post.id}`;

  const [heartPop, setHeartPop] = useState(false);

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 1000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.content || 'Check out this post on R.mix',
          url: postUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center">
      {/* Top Header */}
      <header className="w-full max-w-4xl px-4 py-4 flex items-center justify-between border-b border-zinc-800/80 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-30">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <span className="bg-gradient-to-r from-red-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
            R.mix
          </span>
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-semibold transition-colors"
          title="Share Post"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl px-4 py-6 flex flex-col items-center gap-6">
        <article className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Author Header */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.avatar_url}
                      alt={author.username || 'Author'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white uppercase">
                      {(author?.username || 'R')[0]}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{author?.full_name || author?.username || 'R.mix Creator'}</span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    @{author?.username || 'creator'}
                  </span>
                </h2>
                <time
                  dateTime={post.created_at}
                  className="text-[11px] text-zinc-500"
                >
                  {new Date(post.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-full text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
              {post.type || 'Post'}
            </span>
          </div>

          {/* Media Player / Viewer */}
          <div 
            className="relative w-full aspect-[4/5] sm:aspect-square max-h-[640px] bg-black flex items-center justify-center overflow-hidden"
            onDoubleClick={handleDoubleTap}
          >
            {heartPop && (
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <Heart className="w-32 h-32 text-red-500 fill-red-500 animate-heart-pop drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" />
              </div>
            )}
            {videoUrl ? (
              <video
                src={videoUrl}
                
                playsInline
                loop
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={post.content || 'Post Media'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                <Sparkles className="w-8 h-8 text-zinc-600" />
                <p className="text-sm">Media content available on R.mix feed</p>
              </div>
            )}
          </div>

          {/* Post Caption & Engagement */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1.5 text-zinc-300 hover:text-pink-500 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`}
                  />
                  <span className="text-xs font-semibold">{likeCount}</span>
                </button>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Eye className="w-5 h-5" />
                  <span className="text-xs font-semibold">{(Array.isArray(post.post_views) ? post.post_views.length : 0).toLocaleString()} views</span>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="text-zinc-400 hover:text-white transition-colors"
                title="Share link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {post.content && (
              <p className="text-sm text-zinc-200 leading-relaxed break-words whitespace-pre-line">
                {post.content}
              </p>
            )}

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
              <Link
                href="/"
                className="w-full py-2.5 bg-gradient-to-r from-red-600 via-pink-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold text-center transition-all shadow-lg shadow-pink-600/20"
              >
                Explore More on R.mix
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
