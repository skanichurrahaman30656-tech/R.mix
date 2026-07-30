"use client";
import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Bookmark, Loader2 } from 'lucide-react';
import { VideoPlayer } from '../shared/VideoPlayer';

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
  handleStoryClick
}: any) {
  return (
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
              <Image width={500} height={500} referrerPolicy="no-referrer" src={profile?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt="Your Story" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center border-2 border-zinc-950">
              <span className="text-white text-xs leading-none font-bold">+</span>
            </div>
          </div>
          <span className="text-xs font-medium text-zinc-500">Your Story</span>
        </div>

        {/* Story List */}
        {stories.map((story: any) => (
          <div
            key={story.id}
            onClick={() => handleStoryClick(story.id)}
            className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer"
          >
            <div className="relative rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-950">
                <Image width={500} height={500} referrerPolicy="no-referrer" src={story.avatar} alt={story.author} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xs font-medium truncate w-16 text-center">{story.author}</span>
          </div>
        ))}
      </div>

      <div className="max-w-lg mx-auto w-full">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No posts found. Following people will show their posts here.
          </div>
        ) : (
          <>
            {posts.map((post: any) => (
              <article key={post.id} className={`pb-4 border-b last:border-0 ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'}`}>
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
                        <VideoPlayer src={mediaSrc} className="w-full h-full" autoPlay muted={false} controls playsInline />
                      ) : (
                        <Image width={500} height={500} referrerPolicy="no-referrer" src={mediaSrc} alt="Post content" className="w-full h-full object-cover cursor-pointer" />
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

                  <div className="font-semibold text-sm mb-1">{post.likes.toLocaleString()} likes</div>
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
    </>
  );
}
