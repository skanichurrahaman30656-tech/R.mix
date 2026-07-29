const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const regex = /<div className="font-semibold text-sm mb-1">\{post\.likes\.toLocaleString\(\)\} likes<\/div>[\s\S]*?<\/h3>\s*\{searchResults\.profiles\.length === 0 \? \(/;

const fixedPart = `<div className="font-semibold text-sm mb-1">{post.likes.toLocaleString()} likes</div>

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
                        <img referrerPolicy="no-referrer" src={user?.user_metadata?.avatar_url || profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="You" className="w-7 h-7 rounded-full object-cover" />
                        <input 
                          type="text" 
                          placeholder="Add a comment..." 
                          className={\`flex-1 bg-transparent text-sm focus:outline-none \${isDarkMode ? 'text-white' : 'text-black'}\`}
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
        )}

        {/* ==================== VIEW MODE 2: DEDICATED SEARCH PAGE ==================== */}
        {viewMode === 'search' && (
          <div className="px-4 py-2 space-y-6">
            
            {/* Real Search Results from Supabase Profiles/Posts */}
            {searchQuery && !searchLoading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Profiles Match */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Users
                  </h3>
                  {searchResults.profiles.length === 0 ? (`;

code = code.replace(regex, fixedPart);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
