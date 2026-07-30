"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Shield, Users, FileText, AlertTriangle, BarChart, 
  Database, Bell, CheckSquare, Settings, LogOut, Loader2 
} from "lucide-react";

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  useEffect(() => {
    const verifyAdmin = async () => {
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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-zinc-400 mb-6">You do not have permission to view this page.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const tabs = [
    { name: "Dashboard", icon: <BarChart className="w-5 h-5" /> },
    { name: "User Management", icon: <Users className="w-5 h-5" /> },
    { name: "Post Management", icon: <FileText className="w-5 h-5" /> },
    { name: "Reported Content", icon: <AlertTriangle className="w-5 h-5" /> },
    { name: "Analytics", icon: <BarChart className="w-5 h-5" /> },
    { name: "Storage Manager", icon: <Database className="w-5 h-5" /> },
    { name: "Notifications", icon: <Bell className="w-5 h-5" /> },
    { name: "Verification Requests", icon: <CheckSquare className="w-5 h-5" /> },
    { name: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {tabs.map((tab) => (
              <li key={tab.name}>
                <button
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.name 
                      ? 'bg-indigo-600/10 text-indigo-400' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center px-8">
          <h1 className="text-xl font-semibold">{activeTab}</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-2">{activeTab} Module</h3>
            <p className="text-zinc-400 text-sm">
              This module is securely protected by server-side authorization. Only the owner can access these controls.
            </p>
            
            <div className="mt-8 border-2 border-dashed border-zinc-800 rounded-lg h-64 flex items-center justify-center text-zinc-500">
              {activeTab} data will be displayed here
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
