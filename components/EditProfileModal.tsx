"use client";
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/compress';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  user: any;
  onProfileUpdated?: () => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, user, onProfileUpdated }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    try {
      const processedFile = await compressImage(file, type === 'avatar' ? 512 : 1920);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'avatar') {
          setAvatarFile(processedFile);
          setAvatarPreview(event.target?.result as string);
        } else {
          setCoverFile(processedFile);
          setCoverPreview(event.target?.result as string);
        }
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      setError("Failed to compress image");
    }
  };

  const uploadImage = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      let finalAvatarUrl = profile?.avatar_url;
      let finalCoverUrl = profile?.cover_url;

      if (avatarFile) {
        finalAvatarUrl = await uploadImage(avatarFile, 'avatars');
      }

      if (coverFile) {
        finalCoverUrl = await uploadImage(coverFile, 'avatars'); // Storing cover in avatars bucket as well for simplicity
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          website,
          avatar_url: finalAvatarUrl,
          cover_url: finalCoverUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (onProfileUpdated) onProfileUpdated();
      onClose();

    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
          <h3 className="font-semibold text-lg">Edit Profile</h3>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 text-sm m-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Cover Photo */}
          <div className="relative h-32 bg-gray-200 w-full group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
            {(coverPreview || profile?.cover_url) ? (
              <img src={coverPreview || profile?.cover_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
              <span className="text-white text-sm font-semibold ml-2">Change Cover</span>
            </div>
            <input 
              type="file" 
              ref={coverInputRef} 
              onChange={(e) => handleImageSelect(e, 'cover')} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Avatar Photo */}
          <div className="px-4 relative flex justify-center -mt-12 mb-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100">
                <img src={avatarPreview || profile?.avatar_url || "https://picsum.photos/seed/me/100/100"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={(e) => handleImageSelect(e, 'avatar')} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="px-4 space-y-4 pb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Bio</label>
              <input 
                type="text" 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors"
                placeholder="Write a bio"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Website</label>
              <input 
                type="url" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors"
                placeholder="https://"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
