"use client";
import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Bookmark, Loader2, Users, Play, Volume2, VolumeX } from 'lucide-react';
import { VideoPlayer } from '../shared/VideoPlayer';
import { ViewTracker } from '../shared/ViewTracker';
import { Lightbox } from '../shared/Lightbox';

export function FeedPage({
  posts,
  hasMorePosts,
  isLoadingMore,
  loadMoreRef,
  isDarkMode,
  user,
  profile,
  followedUsers,
  storyUploading,
  storyInputRef,
  handleLike,
  handleToggleComments,
  handleShare,
  handleBookmark,
  toggleFollow,
  openUserProfile,
  handleCommentChange,
  submitComment,
  stories,
  handleStoryClick,
  activeLiveSessions,
  onJoinLive,
  onVideoTap
}: any) {
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const [isFeedMuted, setIsFeedMuted] = React.useState(true);

  return (
    <>
      {/* Facebook-style Create Post Card */}
      <div className={`mx-4 mb-4 p-3.5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
            <Image width={100} height={100} referrerPolicy="no-referrer" src={profile?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div 
            onClick={() => {
              const btn = document.querySelector('[title="Create Post"]') || document.getElementById('create-post-trigger');
              if (btn) (btn as HTMLElement).click();
            }}
            className={`flex-1 px-4 py-2.5 rounded-full text-sm cursor-pointer transition-colors ${isDarkMode ? 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'}`}
          >
            What&apos;s on your mind?
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2.5">
          <button 
            onClick={() => {
              const btn = document.getElementById('create-photo-trigger') || document.querySelector('[title="Create Post"]');
              if (btn) (btn as HTMLElement).click();
            }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-zinc-800/40 text-xs font-semibold text-emerald-400 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Photo</span>
          </button>
          <button 
            onClick={() => {
              const btn = document.getElementById('create-video-trigger') || document.querySelector('[title="Create Post"]');
              if (btn) (btn as HTMLElement).click();
            }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-zinc-800/40 text-xs font-semibold text-indigo-400 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Video</span>
          </button>
        </div>
      </div>

      {/* Active Live Broadcasts */}
      {activeLiveSessions && activeLiveSessions.length > 0 && (
        <div className={`mx-4 mb-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Active Live Rooms ({activeLiveSessions.length})</span>
          </h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {activeLiveSessions.map((session: any) => (
              <div
                key={session.id}
                onClick={() => onJoinLive(session)}
                className="flex-shrink-0 w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-3 hover:border-indigo-500/60 transition-all cursor-pointer relative overflow-hidden space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-red-500/60">
                    <Image
                      width={50}
                      height={50}
                      referrerPolicy="no-referrer"
                      src={session.host?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'}
                      alt={session.host?.username || 'Host'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-zinc-400 font-bold truncate">@{session.host?.username || 'user'}</p>
                    <span className="text-[9px] text-zinc-500 font-medium">Live now</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                    {session.title}
                  </h4>
                  {session.description && (
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{session.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-900/60">
                  <span className="px-1.5 py-0.5 rounded bg-red-600/10 text-red-500 border border-red-500/10 text-[8px] font-black tracking-wider uppercase">
                    LIVE
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    <span>{session.viewer_count || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories + Reels Tabs & Horizontal Scroll Section */}
      <div className={`mx-4 mb-4 p-3 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center gap-6 border-b border-zinc-800/50 pb-2.5 mb-3 px-2">
          <button className="relative pb-1 text-xs font-bold text-indigo-400 flex items-center gap-1.5">
            <span>Stories</span>
            <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          </button>
          <button className="relative pb-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5">
            <span>Reels</span>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {/* First card = Create Story */}
          <div 
            onClick={() => storyInputRef.current?.click()}
            className={`flex-shrink-0 w-24 h-36 rounded-2xl border overflow-hidden relative cursor-pointer flex flex-col justify-end p-2 group transition-transform hover:scale-[1.02] ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}
          >
            <div className="absolute inset-0">
              <Image width={200} height={300} referrerPolicy="no-referrer" src={profile?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt="Create Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg">
              <span className="text-white text-base font-bold">+</span>
            </div>
            <span className="relative z-10 text-[11px] font-bold text-white text-center truncate">Create Story</span>
          </div>

          {/* Story Cards with rounded corners & blue ring around active stories */}
          {stories.map((story: any) => (
            <div
              key={story.id}
              onClick={() => handleStoryClick(story.id)}
              className="flex-shrink-0 w-24 h-36 rounded-2xl border border-indigo-500/80 ring-2 ring-indigo-500/50 overflow-hidden relative cursor-pointer flex flex-col justify-between p-2 shadow-lg group transition-transform hover:scale-[1.02]"
            >
              <div className="absolute inset-0 z-0">
                <Image width={200} height={300} referrerPolicy="no-referrer" src={story.avatar || 'https://picsum.photos/seed/story/200/300'} alt={story.author} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              </div>
              <div className="relative z-10 w-7 h-7 rounded-full overflow-hidden border-2 border-indigo-500 flex-shrink-0">
                <Image width={50} height={50} referrerPolicy="no-referrer" src={story.avatar} alt="Author" className="w-full h-full object-cover" />
              </div>
              <span className="relative z-10 text-[11px] font-bold text-white truncate drop-shadow">
                {story.author}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No posts found. Following people will show their posts here.
          </div>
        ) : (
          <>
            {posts.map((post: any) => (
              <article key={post.id} className={`pb-4 border-b last:border-0 ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'} relative`}>
                <ViewTracker type={post.type === "reel" ? "reel" : post.type === "video" ? "video" : "post"} id={post.id} userId={user?.id} />
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div
                    onClick={() => openUserProfile(post.user_id)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800">
                      <Image width={500} height={500} referrerPolicy="no-referrer" src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{post.author}</h3>
                      {post.handle && <p className="text-[11px] text-zinc-400">{post.handle}</p>}
                    </div>
                  </div>
                  {post.user_id !== user?.id && (
                    <button
                      onClick={() => toggleFollow(post.user_id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        followedUsers[post.user_id] || followedUsers[post.author]
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      {followedUsers[post.user_id] || followedUsers[post.author] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>

                {/* Media */}
                {(() => {
                  const mediaList = typeof post.media_url === "string" ? (() => { try { const p = JSON.parse(post.media_url); return Array.isArray(p) ? p : [p]; } catch { return [post.media_url]; } })() : post.media_url || [];
                  const mediaSrc = mediaList[0] || post.image;
                  if (!mediaSrc) return null;
                  return (
                    <div className="aspect-square bg-zinc-900 relative rounded-md overflow-hidden mx-4 my-2 border border-zinc-800/50" onDoubleClick={() => handleLike(post.id, post.isLiked)}>
                      {post.type === 'video' || post.type === 'reel' ? (
                        <div 
                          className="w-full h-full cursor-pointer relative group" 
                          onClick={() => onVideoTap && onVideoTap(post.id)}
                        >
                          <VideoPlayer src={mediaSrc} className="w-full h-full pointer-events-none" autoPlay muted={isFeedMuted} controls={false} playsInline />
                          
                          {/* Mute Toggle Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFeedMuted(!isFeedMuted);
                            }}
                            className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 transition-colors pointer-events-auto"
                          >
                            {isFeedMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                          </button>

                          <div className="absolute inset-0 bg-black/10 hover:bg-black/30 flex items-center justify-center transition-colors pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Image 
                          width={500} 
                          height={500} 
                          referrerPolicy="no-referrer" 
                          src={mediaSrc} 
                          alt="Post content" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                          onClick={() => setLightboxSrc(mediaSrc)}
                        />
                      )}
                    </div>
                  );
                })()}

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
                      <button onClick={() => handleShare(post.id)} className="hover:opacity-70 transition-opacity">
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                    <button onClick={() => handleBookmark(post.id, post.isBookmarked)} className="hover:opacity-70 transition-opacity">
                      <Bookmark className={`w-6 h-6 transition-colors ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="font-semibold text-sm mb-1 text-zinc-300">
                    {post.likes.toLocaleString()} likes
                    {(post.type === "video" || post.type === "reel") && post.views > 0 && ` • ${post.views.toLocaleString()} views`}
                  </div>
                  <div className="text-sm mb-1">
                    <span
                      onClick={() => openUserProfile(post.user_id)}
                      className="font-semibold mr-2 hover:opacity-70 cursor-pointer"
                    >
                      {post.author}
                    </span>
                    <span>{post.caption}</span>
                  </div>

                  {post.commentsCount > 0 && (
                    <div
                      className="text-zinc-500 text-sm cursor-pointer hover:underline mb-1"
                      onClick={() => handleToggleComments(post.id)}
                    >
                      View all {post.commentsCount} comments
                    </div>
                  )}
                  {post.showComments && (
                    <div className="space-y-3 mt-2 mb-3 px-1">
                      {post.comments.map((comment: any, idx: number) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <span
                            onClick={() => openUserProfile(comment.profiles?.id)}
                            className="font-semibold cursor-pointer hover:underline"
                          >
                            {comment.profiles?.username || 'user'}
                          </span>
                          <span className="text-zinc-300">{comment.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <Image width={500} height={500} referrerPolicy="no-referrer" src={user?.user_metadata?.avatar_url || profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="You" className="w-7 h-7 rounded-full object-cover" />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className={`flex-1 bg-transparent text-sm focus:outline-none ${isDarkMode ? 'text-white' : 'text-black'}`}
                      value={post.newComment}
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
            ))}

            {hasMorePosts && (
              <div className="py-6 text-center" ref={loadMoreRef}>
                {isLoadingMore ? (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  <span className="text-xs font-bold text-zinc-500">Scroll for more</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
