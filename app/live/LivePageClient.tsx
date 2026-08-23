"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LivePage } from '@/components/live/LivePage';
import { Loader2 } from 'lucide-react';

export default function LivePageClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(session.user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(profileData);
      } catch (err) {
        console.error('Error during live client verification:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setProfile(null);
        } else {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Synchronizing broadcast feed...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-6">
      <LivePage 
        user={user}
        profile={profile}
        isDarkMode={true}
        supabase={supabase}
        onClose={() => router.push('/')}
      />
    </div>
  );
}
