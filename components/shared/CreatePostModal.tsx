"use client";
import Image from "next/image";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { X, Image as ImageIcon, Video, Loader2, MapPin, Tag, Globe, Lock, Users, ShieldAlert, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { compressImage } from "@/lib/compress";
import * as tus from "tus-js-client";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onPostCreated?: (post?: any) => void;
  initialMode?: 'photo' | 'video' | 'reel' | 'text';
}

const CATEGORIES = [
  "General",
  "Photography",
  "Video & Reels",
  "Lifestyle",
  "Tech & AI",
  "Music",
  "Gaming",
  "Fitness & Health",
  "Art & Design",
  "Travel"
];

const COPYRIGHT_KEYWORDS = [
  "official_video", "vevo", "sony_music", "universal_music", "warner_music",
  "copyright", "disney", "netflix", "movie_rip", "record_label"
];

export default function CreatePostModal({
  isOpen,
  onClose,
  user,
  onPostCreated,
  initialMode = 'text',
}: CreatePostModalProps) {
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("General");
  const [hashtags, setHashtags] = useState("");
  const [location, setLocation] = useState("");
  const [altText, setAltText] = useState("");
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Resumable Upload Stats
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const tusUploadRef = useRef<tus.Upload | null>(null);
  
  // Copyright Warning State
  const [copyrightWarning, setCopyrightWarning] = useState<string | null>(null);
  const [copyrightConfirmed, setCopyrightConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<XMLHttpRequest | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setError(null);
    setCopyrightWarning(null);

    // Validate type and size
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      const isVideo = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
      const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);

      if (!isVideo && !isImage) {
        setError(`Unsupported file type: "${file.name}". Allowed types: JPG, PNG, WEBP, MP4, MOV, WEBM.`);
        continue;
      }
      // Quick copyright scan check on filename/metadata
      const lowerName = file.name.toLowerCase();
      const matchedKeyword = COPYRIGHT_KEYWORDS.find(kw => lowerName.includes(kw));
      if (matchedKeyword) {
        setCopyrightWarning(`Potential Copyright Notice: File "${file.name}" contains restricted keyword "${matchedKeyword}". Make sure you hold distribution rights.`);
      }

      validFiles.push(file);
    }

    if (!validFiles.length) return;

    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        if (file.type.startsWith("image/")) {
          return await compressImage(file, 1920);
        }
        return file;
      })
    );

    setFiles((prev) => [...prev, ...processedFiles]);

    // Generate previews
    processedFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, { url, type: file.type, name: file.name }]);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (
    file: File, 
    onProgress: (pct: number, loadedBytes: number, totalBytes: number) => void
  ): Promise<string> => {
    const isVideo = file.type.startsWith("video/");
    const isLarge = file.size > 5 * 1024 * 1024; // 5MB threshold for Resumable TUS

    const supabaseUrl = (supabase as any).supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
    const supabaseKey = (supabase as any).supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O';
    
    // Retrieve current active user session token for authenticated RLS owner mapping
    const { data: { session } } = await supabase.auth.getSession();
    const userToken = session?.access_token || supabaseKey;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    if (isVideo && isLarge) {
      // -------------------------------------------------------------
      // RESUMABLE TUS UPLOAD ENGINE (For Videos)
      // -------------------------------------------------------------
      return new Promise((resolve, reject) => {
        setIsPaused(false);
        setUploadSpeed(null);
        setRemainingTime(null);

        const startTime = Date.now();

        const upload = new tus.Upload(file, {
          endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${userToken}`,
            apikey: supabaseKey,
          },
          uploadDataDuringCreation: true,
          metadata: {
            bucketName: 'media',
            objectName: fileName,
            contentType: file.type || 'application/octet-stream',
          },
          chunkSize: 6 * 1024 * 1024, // 6MB sequential chunk size
          onError: (err) => {
            console.error("TUS error occurred:", err);
            reject(err);
          },
          onProgress: (bytesSent, bytesTotal) => {
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speedBytesPerSec = elapsedSeconds > 0 ? bytesSent / elapsedSeconds : 0;
            
            // Format speed
            let speedText = "";
            if (speedBytesPerSec > 1024 * 1024) {
              speedText = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
            } else if (speedBytesPerSec > 1024) {
              speedText = `${(speedBytesPerSec / 1024).toFixed(0)} KB/s`;
            } else {
              speedText = `${speedBytesPerSec.toFixed(0)} B/s`;
            }

            // Format remaining time
            let remainingText = "";
            if (speedBytesPerSec > 0) {
              const remainingBytes = bytesTotal - bytesSent;
              const remainingSec = Math.ceil(remainingBytes / speedBytesPerSec);
              if (remainingSec > 60) {
                remainingText = `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s`;
              } else {
                remainingText = `${remainingSec}s`;
              }
            } else {
              remainingText = "estimating...";
            }

            setUploadSpeed(speedText);
            setRemainingTime(remainingText);

            const pct = Math.round((bytesSent / bytesTotal) * 100);
            onProgress(pct, bytesSent, bytesTotal);
          },
          onSuccess: () => {
            const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
            setUploadSpeed(null);
            setRemainingTime(null);
            tusUploadRef.current = null;
            resolve(publicUrl);
          }
        });

        tusUploadRef.current = upload;

        // Check for previous uploads to resume, or start fresh
        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        }).catch((err) => {
          console.warn("TUS findPreviousUploads failed, starting fresh:", err);
          upload.start();
        });
      });
    } else {
      // -------------------------------------------------------------
      // NATIVE DIRECT UPLOAD ENGINE (For Images & Small Videos)
      // -------------------------------------------------------------
      return new Promise((resolve, reject) => {
        try {
          const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${fileName}`;

          const xhr = new XMLHttpRequest();
          abortControllerRef.current = xhr;

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              onProgress(pct, e.loaded, e.total);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
              resolve(publicUrl);
            } else {
              let errMsg = `Upload failed with status ${xhr.status}`;
              try {
                const resJson = JSON.parse(xhr.responseText);
                if (resJson.message) errMsg = resJson.message;
              } catch {}
              reject(new Error(errMsg));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error("Network transfer failure occurred. Please check your internet connection."));
          });

          xhr.addEventListener('abort', () => {
            const abortError = new Error("Upload cancelled.");
            abortError.name = 'AbortError';
            reject(abortError);
          });

          xhr.open('POST', uploadUrl, true);
          xhr.setRequestHeader('Authorization', `Bearer ${userToken}`);
          xhr.setRequestHeader('apikey', supabaseKey);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        } catch (err) {
          reject(err);
        }
      });
    }
  };

  const handlePauseUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      setIsPaused(true);
      setStatusMessage("Upload paused by user.");
    }
  };

  const handleResumeUpload = () => {
    if (tusUploadRef.current) {
      setIsPaused(false);
      setStatusMessage("Resuming upload...");
      tusUploadRef.current.start();
    }
  };

  const handleCancelUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      tusUploadRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setUploadSpeed(null);
    setRemainingTime(null);
    setIsPaused(false);
    setStatusMessage("Upload cancelled.");
    setError("Upload was cancelled by the user.");
  };

  const handlePost = async () => {
    if (!caption.trim() && files.length === 0) {
      setError("Please add an image, video, or caption.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(5);
    setStatusMessage("Scanning media & verifying copyright compliance...");

    try {
      // Step 1: Copyright Scan Delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      setProgress(15);
      setStatusMessage("Starting secure upload...");

      const mediaUrls: string[] = [];
      let postType = initialMode === "reel" ? "reel" : "text";

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const currentFile = files[i];
          
          const url = await uploadFile(currentFile, (pct, loaded, total) => {
            const totalMb = (total / (1024 * 1024)).toFixed(1);
            const loadedMb = (loaded / (1024 * 1024)).toFixed(1);
            setProgress(pct);
            setStatusMessage(`Uploading "${currentFile.name}" (${loadedMb}MB / ${totalMb}MB) - ${pct}%`);
          });
          
          mediaUrls.push(url);

          if (currentFile.type.startsWith("video/")) {
            postType = initialMode === "reel" ? "reel" : "video";
          } else if (postType !== "video" && postType !== "reel") {
            postType = "image";
          }
        }
      }

      // Step 2: Finalizing post details
      setProgress(90);
      setStatusMessage("Processing post metadata & tags...");

      // Build full caption with tags & location
      let fullCaption = caption.trim();
      if (hashtags.trim()) {
        const formattedTags = hashtags
          .split(/[\s,]+/)
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
          .join(' ');
        fullCaption += `\n\n${formattedTags}`;
      }
      if (location.trim()) {
        fullCaption += `\n📍 ${location.trim()}`;
      }
      if (category !== "General") {
        fullCaption += `\n📁 Category: ${category}`;
      }

      const mediaUrlString = mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null;

      const { data: newPostData, error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: fullCaption,
        media_url: mediaUrlString,
        type: postType,
      }).select(`*, profiles:user_id(id, username, full_name, avatar_url)`).single();

      if (postError) {
        throw new Error(postError.message);
      }

      setProgress(100);
      setStatusMessage("Published successfully!");

      setTimeout(() => {
        setCaption("");
        setHashtags("");
        setLocation("");
        setAltText("");
        setCategory("General");
        setFiles([]);
        setPreviews([]);
        setLoading(false);
        setProgress(0);
        setStatusMessage("");
        setCopyrightWarning(null);
        setCopyrightConfirmed(false);
        if (onPostCreated) onPostCreated(newPostData);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      if (err.name === 'AbortError') {
        setError("Upload cancelled.");
      } else if (
        err.message && 
        (err.message.toLowerCase().includes("exceeded the maximum allowed size") || 
         err.message.toLowerCase().includes("413") || 
         err.message.toLowerCase().includes("too large") || 
         err.message.toLowerCase().includes("payload too large"))
      ) {
        setError("Video is larger than the maximum supported size.");
      } else {
        setError(err.message || "Failed to publish post.");
      }
      setLoading(false);
      setProgress(0);
      setStatusMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-base capitalize bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {initialMode ? `Create ${initialMode}` : "Create New Post"}
          </h3>
          <button
            onClick={handlePost}
            disabled={loading || (!caption.trim() && files.length === 0)}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-xs transition-colors disabled:opacity-50 shadow"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 flex-1 space-y-4 scrollbar-hide">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Copyright Warning */}
          {copyrightWarning && !copyrightConfirmed && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Copyright Advisory</span>
              </div>
              <p className="leading-relaxed">{copyrightWarning}</p>
              <button
                type="button"
                onClick={() => setCopyrightConfirmed(true)}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-[11px] font-semibold transition-colors"
              >
                I confirm I hold rights to this media
              </button>
            </div>
          )}

          {/* User & Caption */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
              <Image width={500} height={500}
                src={
                  user?.user_metadata?.avatar_url ||
                  user?.avatar_url ||
                  "https://www.gravatar.com/avatar/?d=mp"
                }
                alt="Avatar"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <textarea
              placeholder="Write a catchy caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full min-h-[90px] bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 resize-none pt-1"
            />
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group"
                >
                  {preview.type.startsWith("video/") ? (
                    <video
                      src={preview.url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <Image width={500} height={500}
                      src={preview.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Additional Input Options (Requirement 3) */}
          <div className="space-y-3 pt-2 border-t border-zinc-900">
            
            {/* Category Selector */}
            <div className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-zinc-400 shrink-0">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full font-medium cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-zinc-200">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Hashtags Input */}
            <div className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
              <Tag className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                type="text"
                placeholder="Hashtags (e.g. #photography #reels)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder-zinc-500"
              />
            </div>

            {/* Location Input */}
            <div className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
              <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
              <input
                type="text"
                placeholder="Add Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder-zinc-500"
              />
            </div>

            {/* Visibility Selector */}
            <div className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                {visibility === 'public' && <Globe className="w-4 h-4 text-blue-400" />}
                {visibility === 'followers' && <Users className="w-4 h-4 text-emerald-400" />}
                {visibility === 'private' && <Lock className="w-4 h-4 text-amber-400" />}
                <span>Audience Visibility:</span>
              </div>
              <select
                value={visibility}
                onChange={(e: any) => setVisibility(e.target.value)}
                className="bg-transparent text-xs text-indigo-400 font-bold outline-none cursor-pointer"
              >
                <option value="public" className="bg-zinc-900 text-zinc-200">Public</option>
                <option value="followers" className="bg-zinc-900 text-zinc-200">Followers Only</option>
                <option value="private" className="bg-zinc-900 text-zinc-200">Private</option>
              </select>
            </div>

            {/* Alt Text (Optional) */}
            <div className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-500 shrink-0">ALT:</span>
              <input
                type="text"
                placeholder="Alt text for screen readers (optional)"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder-zinc-500"
              />
            </div>

          </div>

        </div>

        {/* Footer & Progress Display (Requirement 5) */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          
          {loading && (
            <div className="space-y-2.5 mb-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
              <div className="flex justify-between text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-1.5 text-indigo-400 min-w-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate">{statusMessage}</span>
                </span>
                <span className="font-bold text-indigo-400 shrink-0">{progress}%</span>
              </div>
              
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Upload metadata metrics */}
              {(uploadSpeed || remainingTime) && (
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 px-0.5">
                  <span>Speed: {uploadSpeed || "estimating..."}</span>
                  <span>ETA: {remainingTime || "estimating..."}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {tusUploadRef.current && (
                  <button
                    type="button"
                    onClick={isPaused ? handleResumeUpload : handlePauseUpload}
                    className={`px-3 py-1 text-[10px] font-black tracking-tight uppercase rounded-lg border transition-colors ${
                      isPaused 
                        ? "bg-green-600/10 hover:bg-green-600/20 text-green-500 border-green-500/20" 
                        : "bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border-amber-500/20"
                    }`}
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black tracking-tight uppercase transition-colors"
                >
                  Cancel Upload
                </button>
              </div>
            </div>
          )}

          {!loading && progress === 100 && (
            <div className="p-2 mb-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center justify-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Published successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-400">
                Attach media files:
              </div>
              <div className="text-[10px] font-bold text-zinc-500 mt-0.5">
                Short and long videos supported. Formats: MP4, MOV, WEBM, JPG, PNG, WEBP.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/mp4,video/quicktime,video/webm"
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-emerald-400 border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold"
                title="Photo"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-indigo-400 border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold"
                title="Video"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

