import React from 'react';
import { Film } from 'lucide-react';
import { ReelCardItem } from './ReelCardItem';

export function ReelsPage({
  reelsFeed,
  setCreateMode,
  setShowCreatePost,
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
  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] snap-y snap-mandatory overflow-y-auto scrollbar-hide px-2">
      {reelsFeed.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="p-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Film className="w-10 h-10" />
          </div>
          <div className="text-xl font-bold text-white">No Reels Uploaded Yet</div>
          <p className="text-xs text-zinc-400 max-w-xs">Upload your first short video reel to kickstart the Reels feed!</p>
          <button 
            onClick={() => {
              setCreateMode('reel');
              setShowCreatePost(true);
            }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xs shadow-lg"
          >
            Create Reel
          </button>
        </div>
      ) : (
        reelsFeed.map((reelItem: any) => (
          <ReelCardItem 
            key={reelItem.id}
            reelItem={reelItem}
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
        ))
      )}
    </div>
  );
}
