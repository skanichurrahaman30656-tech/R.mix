"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, User, Lock, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto login check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let loginEmail = identifier;

      if (!identifier.includes('@')) {
        // Since we can't change the database to add an RPC for username lookup, 
        // we'll try to find the user in the profiles table. However, since the 
        // profiles table doesn't store the email, this is a limitation.
        setError("Username login requires backend support. Please use your email to log in.");
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) throw signInError;

      router.push('/');
    } catch (err: any) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier || !identifier.includes('@')) {
      setError("Please enter your email address first");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("Password reset instructions sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center p-4 pb-20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold italic tracking-tighter mb-2">R.mix</h1>
          <p className="text-gray-500 text-sm">Log in to see photos and videos from your friends.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Email or Username" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <div 
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                onClick={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>Remember me</span>
            </label>
            
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-500 font-medium hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="text-center mt-6 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account? <a href="/signup" className="text-blue-500 font-semibold hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
