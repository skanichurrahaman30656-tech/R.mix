"use client";
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onPostCreated?: () => void;
}

import { compressImage } from '@/lib/compress';

export default function CreatePostModal({ isOpen, onClose, user, onPostCreated }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Validate size and type
    const validFiles = selectedFiles.filter(file => {
      const isVideo = file.type.startsWith('video/mp4') || file.type.startsWith('video/quicktime');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        setError("Only images and MP4 videos are supported.");
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB.");
        return false;
      }
      return true;
    });

    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        if (file.type.startsWith('image/')) {
          return await compressImage(file, 1920);
        }
        return file;
      })
    );

    setFiles(prev => [...prev, ...processedFiles]);

    // Generate previews
    processedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(prev => [...prev, { url, type: file.type }]);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, { 
        upsert: false,
        cacheControl: '3600'
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handlePost = async () => {
    if (!caption.trim() && files.length === 0) {
      setError("Please add an image, video, or caption.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      const mediaUrls: string[] = [];
      let postType = 'text';

      if (files.length > 0) {
        // Simple progress simulation for UX
        const progressInterval = setInterval(() => {
          setProgress(p => Math.min(p + 10, 90));
        }, 500);

        for (let i = 0; i < files.length; i++) {
          const url = await uploadFile(files[i]);
          mediaUrls.push(url);
          if (files[i].type.startsWith('video/')) {
            postType = 'video';
          } else if (postType !== 'video') {
            postType = 'image';
          }
        }
        clearInterval(progressInterval);
      }
      
      setProgress(95);

      const mediaUrlString = mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null;

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption,
          media_url: mediaUrlString,
          type: postType
        });

      if (postError) throw postError;

      setProgress(100);
      setTimeout(() => {
        setCaption('');
        setFiles([]);
        setPreviews([]);
        setLoading(false);
        setProgress(0);
        if (onPostCreated) onPostCreated();
        onClose();
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create post.");
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
          <h3 className="font-semibold text-lg">Create new post</h3>
          <button 
            onClick={handlePost} 
            disabled={loading || (!caption.trim() && files.length === 0)}
            className="text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50 transition-colors"
          >
            Post
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1 space-y-4">
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              <img src={user.user_metadata?.avatar_url || "https://picsum.photos/seed/me/100/100"} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full min-h-[100px] resize-none border-none outline-none text-base placeholder-gray-400 mt-2"
            />
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {preview.type.startsWith('video/') ? (
                    <video src={preview.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button 
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100">
          {loading && progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-600 px-1">
              Add to your post
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,video/mp4,video/quicktime" 
                multiple
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-green-500"
                title="Photo"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-500"
                title="Video"
              >
                <Video className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
