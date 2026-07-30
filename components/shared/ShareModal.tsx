import React, { useState, useEffect } from 'react';
import { X, Copy, Share, Send, Check } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function ShareModal({ isOpen, onClose, postId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      supabase.from('profiles').select('id, username, full_name, avatar_url').limit(10).then(({ data }) => {
        if (data) setUsers(data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const url = `${window.location.origin}?post=${postId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          url: url
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Native share is not supported on this device.");
    }
  };

  const handleSendToUser = (user: any) => {
    // Mock sending to user
    alert(`Sent to ${user.username}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-zinc-900 sm:rounded-2xl rounded-t-2xl p-4 animate-in slide-in-from-bottom-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Share Post</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={handleNativeShare} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <Share className="w-6 h-6 text-white" />
            <span className="text-xs text-white/90">Share via...</span>
          </button>
          <button onClick={handleCopy} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
            {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6 text-white" />}
            <span className="text-xs text-white/90">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <h4 className="text-sm font-semibold text-white/70 mb-3">Send to (Internal Share)</h4>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {users.map(u => (
            <div key={u.id} className="flex flex-col items-center gap-1 cursor-pointer min-w-[70px]" onClick={() => handleSendToUser(u)}>
              <Image 
                src={u.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                alt={u.username} 
                width={50} height={50} 
                className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs text-white/80 truncate w-full text-center">{u.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
