"use client";
import React, { useState } from 'react';
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
  LogOut,
  ChevronRight
} from 'lucide-react';

interface MainMenuPanelProps {
  profile: any;
  onNavigateToProfile: () => void;
  onNavigateToFeed: () => void;
  onNavigateToSettings: () => void;
  isDarkMode: boolean;
}

export const MainMenuPanel: React.FC<MainMenuPanelProps> = ({ 
  profile, 
  onNavigateToProfile,
  onNavigateToFeed,
  onNavigateToSettings,
  isDarkMode
}) => {
  const [showMore, setShowMore] = useState(false);

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
            />
          </div>
          <div className="flex-1 font-semibold text-lg">
            {profile?.full_name || profile?.username || 'R.mix User'}
          </div>
        </div>

        {/* 2. Create Rmix Page */}
        <div 
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
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Flag className="w-7 h-7 text-orange-500 fill-orange-500/20" />
              <span className="font-semibold text-sm">Page</span>
            </div>
            
            {/* 5. News Feed */}
            <div onClick={onNavigateToFeed} className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Newspaper className="w-7 h-7 text-blue-500 fill-blue-500/20" />
              <span className="font-semibold text-sm">News Feed</span>
            </div>

            {/* 6. Saved */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Bookmark className="w-7 h-7 text-purple-500 fill-purple-500/20" />
              <span className="font-semibold text-sm">Saved</span>
            </div>

            {/* 7. Memories 8 */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Clock className="w-7 h-7 text-cyan-500 fill-cyan-500/20" />
              <span className="font-semibold text-sm">Memories 8</span>
            </div>

            {/* 8. Groups */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Users className="w-7 h-7 text-blue-400 fill-blue-400/20" />
              <span className="font-semibold text-sm">Groups</span>
            </div>

            {/* 9. Marketplace */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Store className="w-7 h-7 text-emerald-500 fill-emerald-500/20" />
              <span className="font-semibold text-sm">Marketplace</span>
            </div>
            
            {/* 10. Find Friends */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <UserPlus className="w-7 h-7 text-indigo-500 fill-indigo-500/20" />
              <span className="font-semibold text-sm">Find Friends</span>
            </div>

            {/* 11. Feeds */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <List className="w-7 h-7 text-blue-500 fill-blue-500/20" />
              <span className="font-semibold text-sm">Feeds</span>
            </div>

            {/* 12. Events */}
            <div className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-gray-50'}`}>
              <Calendar className="w-7 h-7 text-red-500 fill-red-500/20" />
              <span className="font-semibold text-sm">Events</span>
            </div>

            {/* Hidden items for See More (None currently as per prompt) */}
            {showMore && (
              <>
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
          {/* 14. Help and Support */}
          <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                <HelpCircle className="w-6 h-6" />
              </div>
              <span className="font-semibold text-lg">Help and Support</span>
            </div>
            <ChevronDown className="w-5 h-5 opacity-50" />
          </div>

          {/* 15. Settings and Privacy */}
          <div 
            onClick={onNavigateToSettings}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                <Settings className="w-6 h-6" />
              </div>
              <span className="font-semibold text-lg">Settings and Privacy</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </div>

          {/* 16. Upgrades */}
          <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <span className="font-semibold text-lg">Upgrades</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
