"use client";
import React from 'react';
import Image from 'next/image';
import { Search, Loader2, Clock, X, Flame, ArrowUpRight } from 'lucide-react';

export function SearchPage({
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchResults,
  recentSearches,
  setRecentSearches,
  realTrendingHashtags,
  suggestedUsers,
  followedUsers,
  toggleFollow,
  isDarkMode
}: any) {
  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search creators, hashtags, or content..."
          className={`w-full pl-11 pr-10 py-3 rounded-xl border outline-none font-medium transition-colors ${
            isDarkMode 
              ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white placeholder-zinc-500' 
              : 'bg-white border-zinc-200 focus:border-indigo-500 text-black placeholder-zinc-400 shadow-sm'
          }`}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className={`absolute inset-y-0 right-0 pr-4 flex items-center ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Search Results */}
      {searchQuery && (
        <div className="space-y-4">
          {searchLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Matching Creators */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Creators ({searchResults.profiles.length})</h3>
                {searchResults.profiles.length === 0 ? (
                  <div className="text-xs text-zinc-500">No matching creators found.</div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.profiles.map((p: any) => (
                      <div 
                        key={p.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Image width={500} height={500} referrerPolicy="no-referrer" src={p.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt={p.username} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                          <div>
                            <div className="font-semibold text-sm">{p.full_name || p.username}</div>
                            <div className="text-xs text-zinc-400">@{p.username}</div>
                          </div>
                        </div>
                        {p.id !== p.currentUserId && (
                          <button 
                            onClick={() => toggleFollow(p)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                              followedUsers[p.id] || followedUsers[p.username]
                                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                            }`}
                          >
                            {followedUsers[p.id] || followedUsers[p.username] ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching Posts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Matching Posts ({searchResults.posts.length})</h3>
                {searchResults.posts.length === 0 ? (
                  <div className="text-xs text-zinc-500">No matching posts found.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {searchResults.posts.map((p: any) => (
                      <div key={p.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                        <div className="text-xs font-bold text-zinc-200">@{p.profiles?.username || 'user'}</div>
                        <div className="text-xs text-zinc-400 line-clamp-2">{p.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Searches */}
      {!searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Searches</span>
            {recentSearches.length > 0 && (
              <button onClick={() => { setRecentSearches([]); localStorage.removeItem('rmix_recent_searches'); }} className="text-xs text-indigo-400 font-semibold hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.length === 0 ? (
              <span className="text-xs text-zinc-500">No recent search history</span>
            ) : (
              recentSearches.map((item: any, idx: number) => (
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
                      const next = recentSearches.filter((_: any, i: number) => i !== idx);
                      setRecentSearches(next);
                      localStorage.setItem('rmix_recent_searches', JSON.stringify(next));
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

      {/* Trending Hashtags from Real Database Posts */}
      {!searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>Trending Hashtags</span>
          </div>
          {realTrendingHashtags.length === 0 ? (
            <div className="text-xs text-zinc-500">No active hashtags in database posts yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {realTrendingHashtags.map((tag: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setSearchQuery(tag)}
                  className={`p-3 rounded-xl border text-left transition-colors flex justify-between items-center ${
                    isDarkMode ? 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800/80' : 'bg-white border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-indigo-400">{tag}</div>
                    <div className="text-[11px] text-zinc-400">Community Tag</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Real Users from Database */}
      {!searchQuery && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Suggested Community Creators</span>
          {suggestedUsers.length === 0 ? (
            <div className="text-xs text-zinc-500">No other registered users yet.</div>
          ) : (
            <div className="space-y-2">
              {suggestedUsers.map((sUser: any) => (
                <div 
                  key={sUser.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image width={500} height={500} referrerPolicy="no-referrer" src={sUser.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt={sUser.username} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                    <div>
                      <div className="font-semibold text-sm">{sUser.full_name || sUser.username}</div>
                      <div className="text-xs text-indigo-400">@{sUser.username}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">{sUser.bio || 'Digital Creator'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleFollow(sUser)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                      followedUsers[sUser.id] || followedUsers[sUser.username]
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    }`}
                  >
                    {followedUsers[sUser.id] || followedUsers[sUser.username] ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
