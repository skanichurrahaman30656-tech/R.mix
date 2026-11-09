"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Users, 
  Store, 
  UserPlus, 
  List, 
  Calendar,
  HelpCircle, 
  Settings, 
  ArrowUpCircle,
  Flag,
  Newspaper,
  Bookmark,
  PlusSquare,
  X,
  Check,
  Sparkles,
  Heart,
  MessageCircle,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface MainMenuPanelProps {
  profile: any;
  user: any;
  supabase: any;
  onNavigateToProfile: () => void;
  onNavigateToFeed: () => void;
  onNavigateToSettings: () => void;
  onOpenDashboard: () => void;
  isDarkMode: boolean;
}

export const MainMenuPanel: React.FC<MainMenuPanelProps> = ({ 
  profile, 
  user,
  supabase,
  onNavigateToProfile,
  onNavigateToFeed,
  onNavigateToSettings,
  onOpenDashboard,
  isDarkMode
}) => {
  const [showMore, setShowMore] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // States for interactive modals
  const [pageName, setPageName] = useState('');
  const [pageCategory, setPageCategory] = useState('Creator');
  const [myPages, setMyPages] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([
    { id: '1', name: 'R.mix Creators Community', members: '14.2K members', joined: true },
    { id: '2', name: 'Video Editors & Filmmakers', members: '8.5K members', joined: false },
    { id: '3', name: 'Photography & Aesthetics', members: '22.1K members', joined: true },
    { id: '4', name: 'Viral Reels & Trends', members: '45.0K members', joined: false }
  ]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([
    { id: '1', title: 'Creator Ring Light Pro', price: '$45', seller: 'Studio Gear' },
    { id: '2', title: 'Wireless Lavalier Mic', price: '$29', seller: 'AudioTech' },
    { id: '3', title: '4K Gimbal Stabilizer', price: '$120', seller: 'ProVideo' }
  ]);
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([
    { id: '1', title: 'R.mix Live Creator Masterclass', date: 'Tonight at 8 PM', attendees: 340 },
    { id: '2', title: 'Weekly Video & Reel Awards', date: 'Sunday at 5 PM', attendees: 1250 }
  ]);

  // AI Support Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (user?.id && supabase) {
      // Fetch saved posts
      supabase.from('saved_posts').select('post_id, posts(*, profiles:user_id(username, full_name, avatar_url))').eq('user_id', user.id).then(({ data }: any) => {
        if (data) setSavedPosts(data.map((item: any) => item.posts).filter(Boolean));
      });
      // Fetch suggested users
      supabase.from('profiles').select('*').neq('id', user.id).limit(6).then(({ data }: any) => {
        if (data) setSuggestedFriends(data);
      });
    }
  }, [user?.id, supabase]);

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageName.trim()) return;
    setMyPages(prev => [...prev, { id: Date.now().toString(), name: pageName, category: pageCategory }]);
    setPageName('');
    setActiveModal('pages');
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await fetch('/api/gemini/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      if (data.text) {
        setChatMessages([...updatedMessages, { role: 'model', content: data.text }]);
      } else {
        setChatMessages([...updatedMessages, { role: 'model', content: 'Sorry, I encountered an issue. Please try again.' }]);
      }
    } catch {
      setChatMessages([...updatedMessages, { role: 'model', content: 'Connection error. Please try again later.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={`fixed top-14 bottom-12 left-0 right-0 z-40 overflow-y-auto ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-xl mx-auto p-4 space-y-5 pb-20">
        
        {/* 1. Profile Photo + Name */}
        <div 
          onClick={onNavigateToProfile}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500 flex-shrink-0">
            <Image 
              width={100} 
              height={100} 
              src={profile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
              alt="Profile" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 font-semibold text-lg">
            {profile?.full_name || profile?.username || user?.user_metadata?.full_name || 'R.mix User'}
          </div>
        </div>

        {/* 2. Create Rmix Page */}
        <div 
          onClick={() => setActiveModal('create_page')}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <PlusSquare className="w-6 h-6 text-indigo-500" />
          </div>
          <span className="font-semibold">Create Rmix Page</span>
        </div>

        {/* 3. Your Shortcuts */}
        <div className="pt-2">
          <h3 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>Your Shortcuts</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 4. Page */}
            <div 
              onClick={() => setActiveModal('pages')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <Flag className="w-7 h-7 text-orange-500 fill-orange-500/20" />
              <span className="font-semibold text-sm">Page ({myPages.length})</span>
            </div>
            
            {/* 5. News Feed */}
            <div onClick={onNavigateToFeed} className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Newspaper className="w-7 h-7 text-blue-500 fill-blue-500/20" />
              <span className="font-semibold text-sm">News Feed</span>
            </div>

            {/* 6. Saved */}
            <div 
              onClick={() => setActiveModal('saved')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <Bookmark className="w-7 h-7 text-purple-500 fill-purple-500/20" />
              <span className="font-semibold text-sm">Saved ({savedPosts.length})</span>
            </div>

            {/* 7. Memories */}
            <div 
              onClick={() => setActiveModal('memories')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <Clock className="w-7 h-7 text-cyan-500 fill-cyan-500/20" />
              <span className="font-semibold text-sm">Memories</span>
            </div>

            {/* 8. Groups */}
            <div 
              onClick={() => setActiveModal('groups')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <Users className="w-7 h-7 text-blue-400 fill-blue-400/20" />
              <span className="font-semibold text-sm">Groups</span>
            </div>

            {/* 9. Marketplace */}
            <div 
              onClick={() => setActiveModal('marketplace')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <Store className="w-7 h-7 text-emerald-500 fill-emerald-500/20" />
              <span className="font-semibold text-sm">Marketplace</span>
            </div>
            
            {/* 10. Find Friends */}
            <div 
              onClick={() => setActiveModal('find_friends')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <UserPlus className="w-7 h-7 text-indigo-500 fill-indigo-500/20" />
              <span className="font-semibold text-sm">Find Friends</span>
            </div>

            {/* 11. Feeds */}
            <div 
              onClick={() => setActiveModal('feeds')}
              className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
            >
              <List className="w-7 h-7 text-blue-500 fill-blue-500/20" />
              <span className="font-semibold text-sm">Feeds</span>
            </div>

            {/* Hidden items when showMore is true */}
            {showMore && (
              <>
                <div 
                  onClick={() => setActiveModal('events')}
                  className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border col-span-2 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}
                >
                  <Calendar className="w-7 h-7 text-red-500 fill-red-500/20" />
                  <span className="font-semibold text-sm">Events & Live Masterclasses</span>
                </div>
              </>
            )}
          </div>
          
          {/* 13. See More / See Less */}
          <button 
            onClick={() => setShowMore(!showMore)}
            className={`w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl transition-colors font-semibold ${isDarkMode ? 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300' : 'bg-gray-200 hover:bg-gray-300 text-zinc-700'}`}
          >
            {showMore ? (
              <>
                <ChevronUp className="w-5 h-5" />
                <span>See Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span>See More</span>
              </>
            )}
          </button>
        </div>

        <div className={`h-px w-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Bottom List Items */}
        <div className="space-y-1">
          {/* 14. Help and Support (AI Chatbot) */}
          <div 
            onClick={() => setActiveModal('help')}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                <HelpCircle className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="font-semibold text-lg">Help and Support (AI Assistant)</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </div>

          {/* 15. Settings and Privacy */}
          <div 
            onClick={onNavigateToSettings}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                <Settings className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="font-semibold text-lg">Settings and Privacy</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </div>

          {/* 16. Upgrades */}
          <div 
            onClick={onOpenDashboard}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                <ArrowUpCircle className="w-6 h-6 text-purple-400" />
              </div>
              <span className="font-semibold text-lg">Upgrades (Pro Dashboard)</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </div>
        </div>

      </div>

      {/* INTERACTIVE MODALS OVERLAY */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. Create Page Modal */}
            {activeModal === 'create_page' && (
              <form onSubmit={handleCreatePage} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <Flag className="w-6 h-6 text-indigo-500" />
                  <h3 className="font-bold text-lg">Create Rmix Creator Page</h3>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">Page Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cinematic Productions" 
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-zinc-300 text-black'}`}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">Category</label>
                  <select 
                    value={pageCategory}
                    onChange={(e) => setPageCategory(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-zinc-300 text-black'}`}
                  >
                    <option value="Creator">Digital Creator</option>
                    <option value="Brand">Brand / Business</option>
                    <option value="Entertainment">Entertainment & Media</option>
                    <option value="Gaming">Gaming Community</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all"
                >
                  Create Page
                </button>
              </form>
            )}

            {/* 2. My Pages Modal */}
            {activeModal === 'pages' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <Flag className="w-6 h-6 text-orange-500" />
                  <h3 className="font-bold text-lg">Your Rmix Pages</h3>
                </div>
                {myPages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm space-y-3">
                    <p>You have not created any pages yet.</p>
                    <button 
                      onClick={() => setActiveModal('create_page')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                    >
                      Create First Page
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {myPages.map(p => (
                      <div key={p.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                        <div>
                          <h4 className="font-bold text-sm">{p.name}</h4>
                          <span className="text-[11px] text-indigo-400 font-medium">{p.category}</span>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Saved Posts Modal */}
            {activeModal === 'saved' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <Bookmark className="w-6 h-6 text-purple-500" />
                  <h3 className="font-bold text-lg">Saved Posts ({savedPosts.length})</h3>
                </div>
                {savedPosts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No saved posts found. Bookmark posts in your feed to view them here.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {savedPosts.map((post: any) => (
                      <div key={post.id} className={`p-3 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                          {post.media_url ? (
                            <Image width={100} height={100} src={(() => { try { return JSON.parse(post.media_url)[0]; } catch { return post.media_url; } })()} alt="Media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">Post</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">@{post.profiles?.username || 'user'}</p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{post.content || 'Saved publication'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Memories Modal */}
            {activeModal === 'memories' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg">Today on R.mix</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Looking back at your digital memories. You have published great content and engaged with amazing creators over the past year!
                </p>
                <div className={`p-4 rounded-xl border text-left space-y-2 ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">1 Year Ago Today</span>
                  <p className="text-xs font-medium">✨ Started your creator journey on R.mix.</p>
                </div>
              </div>
            )}

            {/* 5. Groups Modal */}
            {activeModal === 'groups' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <Users className="w-6 h-6 text-blue-400" />
                  <h3 className="font-bold text-lg">Community Groups</h3>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {groupsList.map(g => (
                    <div key={g.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                      <div>
                        <h4 className="font-bold text-sm">{g.name}</h4>
                        <span className="text-[11px] text-zinc-400">{g.members}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setGroupsList(groupsList.map(item => item.id === g.id ? { ...item, joined: !item.joined } : item));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${g.joined ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                      >
                        {g.joined ? 'Joined' : 'Join Group'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Marketplace Modal */}
            {activeModal === 'marketplace' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <Store className="w-6 h-6 text-emerald-500" />
                  <h3 className="font-bold text-lg">Creator Marketplace</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto">
                  {marketplaceItems.map(item => (
                    <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                      <div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <span className="text-[11px] text-zinc-400">Seller: {item.seller}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-400 block">{item.price}</span>
                        <button 
                          onClick={() => alert(`Inquired about ${item.title}!`)}
                          className="mt-1 px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold hover:bg-emerald-600/30"
                        >
                          Inquire
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Find Friends Modal */}
            {activeModal === 'find_friends' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <UserPlus className="w-6 h-6 text-indigo-500" />
                  <h3 className="font-bold text-lg">Suggested Creators</h3>
                </div>
                {suggestedFriends.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-sm">No creators found at the moment.</div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {suggestedFriends.map(f => (
                      <div key={f.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700">
                            <Image width={50} height={50} src={f.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt={f.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs">{f.full_name || f.username}</h4>
                            <span className="text-[10px] text-indigo-400 font-semibold">@{f.username || 'user'}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert(`Followed @${f.username || 'user'}!`)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                        >
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 8. Feeds Modal */}
            {activeModal === 'feeds' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <List className="w-6 h-6 text-blue-500" />
                  <h3 className="font-bold text-lg">Feed Categories</h3>
                </div>
                <div className="space-y-2">
                  <button onClick={() => { setActiveModal(null); onNavigateToFeed(); }} className="w-full text-left p-3 rounded-xl hover:bg-zinc-800/50 flex items-center justify-between font-semibold text-sm">
                    <span>🌟 All Recommendations</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button onClick={() => { setActiveModal(null); onNavigateToFeed(); }} className="w-full text-left p-3 rounded-xl hover:bg-zinc-800/50 flex items-center justify-between font-semibold text-sm">
                    <span>👥 Following Creators</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button onClick={() => { setActiveModal(null); onNavigateToFeed(); }} className="w-full text-left p-3 rounded-xl hover:bg-zinc-800/50 flex items-center justify-between font-semibold text-sm">
                    <span>🔥 Viral Reels & Videos</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            )}

            {/* 9. Events Modal */}
            {activeModal === 'events' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <Calendar className="w-6 h-6 text-red-500" />
                  <h3 className="font-bold text-lg">Upcoming Live Events</h3>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {eventsList.map(ev => (
                    <div key={ev.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-zinc-200'}`}>
                      <div>
                        <h4 className="font-bold text-sm">{ev.title}</h4>
                        <span className="text-[11px] text-red-400 font-semibold">{ev.date}</span>
                      </div>
                      <button onClick={() => alert(`Registered for ${ev.title}!`)} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold">
                        RSVP
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. Help and Support (Gemini AI Support Assistant) */}
            {activeModal === 'help' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <HelpCircle className="w-6 h-6 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-base">R.mix AI Support Assistant</h3>
                    <p className="text-[11px] text-zinc-400">Ask any question about using R.mix</p>
                  </div>
                </div>

                {/* Scrollable Chat Thread */}
                <div className="max-h-72 overflow-y-auto space-y-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs space-y-1">
                      <p className="font-bold text-zinc-300">Hello! How can I help you today?</p>
                      <p>Ask me about uploading videos, reels, stats, or profile setup.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 text-zinc-400 p-3 rounded-2xl text-xs flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Assistant is typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your question here..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-xs focus:outline-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-zinc-300 text-black'}`}
                    required
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
