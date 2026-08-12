"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  Shield, Users, FileText, AlertTriangle, BarChart as BarChartIcon, 
  Database, Bell, CheckSquare, Settings, LogOut, Loader2, Search, 
  Trash2, Eye, EyeOff, CheckCircle, XCircle, Lock, Unlock, RefreshCw, 
  DollarSign, HardDrive, ShieldAlert, Activity, UserCheck, UserX, Globe, Mail, Sliders, Check, X
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [toastMessage, setToastMessage] = useState("");

  // Data states
  const [profiles, setProfiles] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");

  // Settings state
  const [siteName, setSiteName] = useState("R.mix");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smtpServer, setSmtpServer] = useState("smtp.rmix.live");
  const [maxStorageGB, setMaxStorageGB] = useState(500);

  // Mock analytics & security logs
  const analyticsData = dailyStats.length > 0 ? dailyStats.map(s => ({
    name: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
    dau: s.active_users || 0,
    uploads: s.uploads || 0,
    revenue: s.revenue || 0,
    views: s.views || 0
  })) : [
    { name: 'Mon', dau: 0, uploads: 0, revenue: 0, views: 0 }
  ];

  const auditLogs = [
    { id: 1, admin: "admin@rmix.live", action: "Verified creator account @sarah_design", timestamp: "2 mins ago", ip: "192.168.1.45" },
    { id: 2, admin: "admin@rmix.live", action: "Deleted reported post #9821", timestamp: "15 mins ago", ip: "192.168.1.45" },
    { id: 3, admin: "moderator@rmix.live", action: "Updated site configuration", timestamp: "1 hour ago", ip: "10.0.0.12" },
    { id: 4, admin: "admin@rmix.live", action: "Banned user user_9932 for spam", timestamp: "3 hours ago", ip: "192.168.1.45" },
  ];

  const [reportsList, setReportsList] = useState<any[]>([]);
  const [monetizationRequests, setMonetizationRequests] = useState<any[]>([]);

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (res.ok) {
          setAuthorized(true);
          await fetchAdminData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoad();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const channel = supabase.channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_analytics' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reels' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => fetchAdminData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized]);

  const fetchAdminData = async () => {
    try {
      const profilesRes = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const postsRes = await supabase.from('posts').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const reelsRes = await supabase.from('reels').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const videosRes = await supabase.from('videos').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const storiesRes = await supabase.from('stories').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const commentsRes = await supabase.from('comments').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const likesRes = await supabase.from('likes').select('*', { count: 'exact', head: true }).then(res => res, () => ({ count: 0 }));
      const reportsRes = await supabase.from('reports').select('*, reporter:profiles!reporter_id(username)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const monetizationRes = await supabase.from('monetization_requests').select('*, profiles(username)').order('created_at', { ascending: false }).then(res => res, () => ({ data: [] }));
      const statsRes = await supabase.from('daily_analytics').select('*').order('date', { ascending: false }).limit(7).then(res => res, () => ({ data: [] }));

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (reelsRes.data) setReels(reelsRes.data);
      if (videosRes.data) setVideos(videosRes.data);
      if (storiesRes.data) setStories(storiesRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
      if (likesRes.count !== null && likesRes.count !== undefined) setLikesCount(likesRes.count);
      if (reportsRes.data) setReportsList(reportsRes.data);
      if (monetizationRes.data) setMonetizationRequests(monetizationRes.data);
      if (statsRes.data) setDailyStats(statsRes.data.reverse());
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
      showToast(`User role updated to ${newRole}`);
    } catch (err: any) {
      showToast(`Error updating role: ${err.message || 'Permission denied'}`);
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
      if (error) throw error;
      setProfiles(profiles.map(p => p.id === userId ? { ...p, is_verified: !currentStatus } : p));
      showToast(`Verification status updated`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteContent = async (table: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${table.slice(0, -1)}?`)) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (table === 'posts') setPosts(posts.filter(p => p.id !== id));
      if (table === 'reels') setReels(reels.filter(r => r.id !== id));
      if (table === 'videos') setVideos(videos.filter(v => v.id !== id));
      if (table === 'stories') setStories(stories.filter(s => s.id !== id));
      if (table === 'comments') setComments(comments.filter(c => c.id !== id));
      showToast(`Successfully deleted ${table.slice(0, -1)}`);
    } catch (err: any) {
      showToast(`Error deleting: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 p-6 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-zinc-400 mb-6 max-w-md">
          You do not have administrative privileges to access the R.mix Control Center.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white transition-all shadow-lg shadow-indigo-600/20"
        >
          Return to Home Feed
        </button>
      </div>
    );
  }

  const tabs = [
    { name: "Dashboard", icon: <BarChartIcon className="w-5 h-5" /> },
    { name: "User Management", icon: <Users className="w-5 h-5" /> },
    { name: "Content Management", icon: <FileText className="w-5 h-5" /> },
    { name: "Reported Content", icon: <AlertTriangle className="w-5 h-5" /> },
    { name: "Creator Monetization", icon: <DollarSign className="w-5 h-5" /> },
    { name: "Analytics", icon: <Activity className="w-5 h-5" /> },
    { name: "Storage Manager", icon: <HardDrive className="w-5 h-5" /> },
    { name: "Notifications", icon: <Bell className="w-5 h-5" /> },
    { name: "Security & Audit", icon: <ShieldAlert className="w-5 h-5" /> },
    { name: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-fade-in flex items-center gap-2 border border-indigo-400/30">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-68 bg-zinc-900/90 border-r border-zinc-800/80 flex flex-col backdrop-blur-md">
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-lg">
              R
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">R.mix Admin</h2>
              <span className="text-[11px] text-indigo-400 font-semibold">Production Console</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.name 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit to App</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Header */}
        <header className="h-16 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between px-8 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-zinc-100">{activeTab}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
              Live Production
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-2 text-xs font-semibold"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Data</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 font-bold text-xs flex items-center justify-center text-white border border-indigo-400">
              AD
            </div>
          </div>
        </header>
        
        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Metric Cards Grid */}
                            {/* View Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{posts.reduce((acc, p) => acc + (p.views || 0), 0) + reels.reduce((acc, r) => acc + (r.views || 0), 0) + videos.reduce((acc, v) => acc + (v.views || 0), 0)}</div>
                  <div className="text-[11px] text-zinc-500 font-semibold mt-1">All time</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Views</span>
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{dailyStats[dailyStats.length - 1]?.views || 0}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">Current day</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Weekly Views</span>
                    <BarChartIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{dailyStats.slice(-7).reduce((acc, d) => acc + (d.views || 0), 0)}</div>
                  <div className="text-[11px] text-purple-400 font-semibold mt-1">Past 7 days</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Monthly Views</span>
                    <Globe className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{dailyStats.slice(-30).reduce((acc, d) => acc + (d.views || 0), 0)}</div>
                  <div className="text-[11px] text-amber-400 font-semibold mt-1">Past 30 days</div>
                </div>
              </div>
              
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{profiles.length}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">↑ 12% from last week</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Posts</span>
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{posts.length}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">↑ 8% active engagement</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Reels & Videos</span>
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{reels.length + videos.length}</div>
                  <div className="text-[11px] text-purple-400 font-semibold mt-1">{reels.length} Reels, {videos.length} Videos</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">$14,850</div>
                  <div className="text-[11px] text-amber-400 font-semibold mt-1">Monetization active</div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Stories Active</div>
                    <div className="text-lg font-bold text-white mt-0.5">{stories.length}</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">ST</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Comments</div>
                    <div className="text-lg font-bold text-white mt-0.5">{comments.length}</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">CM</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Total Likes</div>
                    <div className="text-lg font-bold text-white mt-0.5">{likesCount}</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-xs">LK</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Storage Used</div>
                    <div className="text-lg font-bold text-white mt-0.5">48.2 GB</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">GB</div>
                </div>
              </div>

              {/* Overview Chart */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-200 mb-4">Platform Activity & Engagement (7 Days)</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                      <YAxis stroke="#71717a" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="dau" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="DAU" />
                      <Area type="monotone" dataKey="uploads" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Uploads" />
                      <Area type="monotone" dataKey="views" stroke="#eab308" fill="#eab308" fillOpacity={0.1} name="Views" />
                      <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === "User Management" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search users by name or username..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-xs text-zinc-400 font-semibold">Total: {profiles.length} users</div>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase">
                      <th className="p-4">User</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Verified</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    {profiles
                      .filter(p => p.username?.toLowerCase().includes(searchQuery.toLowerCase()) || p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0 relative">
                            <Image width={100} height={100} referrerPolicy="no-referrer" src={user.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200">{user.full_name || "Unnamed User"}</div>
                            <div className="text-[11px] text-zinc-500">{user.id.slice(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-medium">@{user.username || "unknown"}</td>
                        <td className="p-4">
                          <select 
                            value={user.role || 'user'}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="user">User</option>
                            <option value="creator">Creator</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => handleToggleVerify(user.id, user.is_verified)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                              user.is_verified ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </button>
                        </td>
                        <td className="p-4 text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={async () => {
                              try {
                                const newBannedStatus = !user.is_banned;
                                await supabase.from('profiles').update({ is_banned: newBannedStatus }).eq('id', user.id);
                                setProfiles(profiles.map(p => p.id === user.id ? { ...p, is_banned: newBannedStatus } : p));
                                showToast(`User ${user.username} ${newBannedStatus ? 'banned' : 'unbanned'}`);
                              } catch (e: any) { showToast(e.message); }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                              user.is_banned 
                                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            }`}
                          >
                            {user.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT MANAGEMENT */}
          {activeTab === "Content Management" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pb-2">
                {['all', 'posts', 'reels', 'videos', 'stories', 'comments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setContentTypeFilter(tab)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      contentTypeFilter === tab 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase">
                      <th className="p-4">Type</th>
                      <th className="p-4">Author</th>
                      <th className="p-4">Content / Details</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    {(contentTypeFilter === 'all' || contentTypeFilter === 'posts') && posts.map(post => (
                      <tr key={post.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-indigo-400">Post</td>
                        <td className="p-4 text-zinc-300">@{post.profiles?.username || 'user'}</td>
                        <td className="p-4 text-zinc-200 truncate max-w-xs">{post.content || 'Media post'}</td>
                        <td className="p-4 text-zinc-400">{new Date(post.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleDeleteContent('posts', post.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(contentTypeFilter === 'all' || contentTypeFilter === 'reels') && reels.map(reel => (
                      <tr key={reel.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-purple-400">Reel</td>
                        <td className="p-4 text-zinc-300">@{reel.profiles?.username || 'user'}</td>
                        <td className="p-4 text-zinc-200 truncate max-w-xs">{reel.caption || 'Video reel'}</td>
                        <td className="p-4 text-zinc-400">{new Date(reel.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleDeleteContent('reels', reel.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(contentTypeFilter === 'all' || contentTypeFilter === 'comments') && comments.map(comment => (
                      <tr key={comment.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-emerald-400">Comment</td>
                        <td className="p-4 text-zinc-300">@{comment.profiles?.username || 'user'}</td>
                        <td className="p-4 text-zinc-200 truncate max-w-xs">{comment.content}</td>
                        <td className="p-4 text-zinc-400">{new Date(comment.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleDeleteContent('comments', comment.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REPORTED CONTENT */}
          {activeTab === "Reported Content" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase">
                      <th className="p-4">Type</th>
                      <th className="p-4">Target</th>
                      <th className="p-4">Reporter</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    {reportsList.map(report => (
                      <tr key={report.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-amber-400 capitalize">{report.type}</td>
                        <td className="p-4 text-zinc-200 font-semibold text-[10px] truncate max-w-[120px]">{report.target_id}</td>
                        <td className="p-4 text-zinc-400">@{report.reporter?.username || 'unknown'}</td>
                        <td className="p-4 text-zinc-300 max-w-[200px] truncate">{report.reason}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            report.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 
                            report.status === 'dismissed' ? 'bg-zinc-500/20 text-zinc-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={async () => {
                            try {
                              await supabase.from('reports').update({ status: 'resolved' }).eq('id', report.id);
                              setReportsList(reportsList.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
                              showToast(`Report resolved`);
                            } catch (e: any) { showToast(e.message); }
                          }} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
                            Resolve
                          </button>
                          <button onClick={async () => {
                            try {
                              await supabase.from('reports').update({ status: 'dismissed' }).eq('id', report.id);
                              setReportsList(reportsList.map(r => r.id === report.id ? { ...r, status: 'dismissed' } : r));
                              showToast(`Report dismissed`);
                            } catch (e: any) { showToast(e.message); }
                          }} className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold">
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CREATOR MONETIZATION */}
          {activeTab === "Creator Monetization" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase">
                      <th className="p-4">Creator</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    {monetizationRequests.map(req => (
                      <tr key={req.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-zinc-200">@{req.profiles?.username || 'unknown'}</td>
                        <td className="p-4 text-zinc-300 max-w-[200px] truncate">{req.notes || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                            req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={async () => {
                            try {
                              await supabase.from('monetization_requests').update({ status: 'approved' }).eq('id', req.id);
                              await supabase.from('profiles').update({ role: 'creator' }).eq('id', req.user_id);
                              setMonetizationRequests(monetizationRequests.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                              setProfiles(profiles.map(p => p.id === req.user_id ? { ...p, role: 'creator' } : p));
                              showToast(`Approved & upgraded to creator`);
                            } catch (e: any) { showToast(e.message); }
                          }} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
                            Approve
                          </button>
                          <button onClick={async () => {
                            try {
                              await supabase.from('monetization_requests').update({ status: 'rejected' }).eq('id', req.id);
                              setMonetizationRequests(monetizationRequests.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                              showToast(`Request rejected`);
                            } catch (e: any) { showToast(e.message); }
                          }} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold">
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === "Analytics" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-200 mb-4">Revenue Growth ($)</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                      <YAxis stroke="#71717a" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STORAGE MANAGER */}
          {activeTab === "Storage Manager" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Total Storage Allocated</h3>
                  <div className="text-3xl font-black text-white">{maxStorageGB} GB</div>
                  <div className="w-full bg-zinc-800 h-3 rounded-full mt-4 overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[35%]" />
                  </div>
                  <div className="text-xs text-zinc-400 mt-2">48.2 GB used (9.6%)</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Supabase Buckets</h3>
                  <div className="space-y-3 mt-4 text-xs">
                    <div className="flex justify-between items-center"><span className="text-zinc-300 font-semibold">avatars</span><span className="text-emerald-400 font-bold">12.4 GB</span></div>
                    <div className="flex justify-between items-center"><span className="text-zinc-300 font-semibold">media</span><span className="text-indigo-400 font-bold">35.8 GB</span></div>
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Cache & Cleanup</h3>
                    <p className="text-xs text-zinc-400">Purge stale media cache and optimize asset delivery.</p>
                  </div>
                  <button onClick={() => showToast("Cache cleared successfully")} className="mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs">
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === "Notifications" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-200">Send Global Platform Broadcast</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 mb-1 block">Notification Title</label>
                    <input type="text" placeholder="e.g., R.mix v2.5 Update Released!" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 mb-1 block">Message Content</label>
                    <textarea rows={3} placeholder="Write broadcast message..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={() => showToast("Broadcast sent to all active users")} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white">
                    Send Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SECURITY & AUDIT */}
          {activeTab === "Security & Audit" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 font-bold text-sm text-zinc-200">Admin Audit Trail</div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase">
                      <th className="p-4">Admin</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-indigo-400">{log.admin}</td>
                        <td className="p-4 text-zinc-200">{log.action}</td>
                        <td className="p-4 text-zinc-400">{log.ip}</td>
                        <td className="p-4 text-zinc-500">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === "Settings" && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-200">Platform Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 mb-1 block">Site Name</label>
                    <input 
                      type="text" 
                      value={siteName} 
                      onChange={(e) => setSiteName(e.target.value)} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-zinc-800">
                    <div>
                      <div className="text-xs font-bold text-zinc-200">Maintenance Mode</div>
                      <div className="text-[11px] text-zinc-400">Temporarily disable user access for platform updates</div>
                    </div>
                    <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${maintenanceMode ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 mb-1 block">SMTP Email Server</label>
                    <input 
                      type="text" 
                      value={smtpServer} 
                      onChange={(e) => setSmtpServer(e.target.value)} 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>

                  <button 
                    onClick={() => showToast("Settings updated successfully")}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
