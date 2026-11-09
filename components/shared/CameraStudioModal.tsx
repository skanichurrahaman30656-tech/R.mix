"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  X, Camera, Video, Film, Music, Volume2, VolumeX, RotateCcw, 
  FlipHorizontal, Zap, ZapOff, Play, Pause, Check, Loader2, 
  Upload, Sparkles, Sliders, AlertCircle, ArrowLeft, RefreshCw,
  FileAudio
} from "lucide-react";
import { supabase, supabaseUrl, supabaseAnonKey } from "@/lib/supabase";
import { 
  getRoyaltyFreePresets, 
  mixVideoWithAudio, 
  isStreamMixingSupported, 
  MusicTrackOption 
} from "@/lib/audioMixer";

interface CameraStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onPostCreated?: (post: any) => void;
  onOpenStandardEditor?: (files: File[], mode: 'photo' | 'video' | 'reel', audioFile?: File | null) => void;
}

type StudioMode = 'photo' | 'video' | 'reel';
type StudioStep = 'capture' | 'review' | 'publish';

export default function CameraStudioModal({
  isOpen,
  onClose,
  user,
  onPostCreated,
  onOpenStandardEditor,
}: CameraStudioModalProps) {
  // Studio navigation
  const [mode, setMode] = useState<StudioMode>('video');
  const [step, setStep] = useState<StudioStep>('capture');

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const maxRecordingSeconds = mode === 'reel' ? 60 : 300; // 60s for reels, 5min for standard video
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Captured media
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('video');

  // Music & Audio Studio state
  const [selectedMusic, setSelectedMusic] = useState<MusicTrackOption | null>(null);
  const [royaltyFreePresets, setRoyaltyFreePresets] = useState<MusicTrackOption[]>([]);
  const [musicStartTime, setMusicStartTime] = useState(0); // in seconds
  const [musicDuration, setMusicDuration] = useState(15);
  const [musicVolume, setMusicVolume] = useState(0.8); // 0 to 1
  const [originalVolume, setOriginalVolume] = useState(1.0); // 0 to 1
  const [isOriginalMuted, setIsOriginalMuted] = useState(false);
  const [showMusicDrawer, setShowMusicDrawer] = useState(false);
  const [userCustomAudioFile, setUserCustomAudioFile] = useState<File | null>(null);

  // Review & Playback
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

  // Post publish metadata
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("Video & Reels");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);

  // DOM Refs
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check camera devices & load royalty-free presets
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }

    // Load royalty-free presets so user has instant audio to test with
    getRoyaltyFreePresets().then((presets) => {
      setRoyaltyFreePresets(presets);
    });
  }, [isOpen]);

  // Start camera stream safely
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setIsInitializingCamera(true);
    setCameraError(null);

    // Stop previous stream tracks cleanly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Your browser or device does not support camera access (requires HTTPS).");
      setIsInitializingCamera(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: mode === 'reel' ? 720 : 1280 },
          height: { ideal: mode === 'reel' ? 1280 : 720 },
        },
        audio: mode !== 'photo', // only request microphone if video/reel mode
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (audioVideoErr) {
        // Fallback: If combined audio+video fails (e.g. mic permission blocked or missing), try video-only
        console.warn("getUserMedia with audio failed, falling back to video-only:", audioVideoErr);
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
      }

      // Verify active video track
      const videoTracks = newStream.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0 || !videoTracks[0].enabled) {
        throw new Error("No active video track received from camera.");
      }

      streamRef.current = newStream;
      setStream(newStream);

      // Check for torch capability
      const videoTrack = videoTracks[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setTorchSupported(!!capabilities.torch);
      }

      // Attach stream to live video element immediately
      if (liveVideoRef.current) {
        const video = liveVideoRef.current;
        video.srcObject = newStream;
        video.muted = true;
        try {
          await video.play();
        } catch (playErr) {
          console.warn("Camera live preview play error:", playErr);
        }
      }
    } catch (err: any) {
      console.warn("Camera getUserMedia error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission denied. Please click the camera/lock icon in your browser address bar to allow camera access.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera device was detected on your computer or phone.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Camera is currently in use by another app or browser tab. Please close other camera apps and retry.");
      } else {
        setCameraError(`Unable to start camera: ${err.message || 'Unknown device error'}`);
      }
    } finally {
      setIsInitializingCamera(false);
    }
  }, [mode]);

  // Synchronize stream attachment to live video element whenever step is capture or stream updates
  useEffect(() => {
    if (step === 'capture' && liveVideoRef.current && stream) {
      const video = liveVideoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.play().catch((err) => {
        console.warn("Live preview auto-play error:", err);
      });
    }
  }, [step, stream]);

  // Start camera when modal opens, step changes to capture, or facingMode changes
  useEffect(() => {
    if (isOpen && step === 'capture') {
      startCamera(facingMode);
    }

    return () => {
      // Cleanup on unmount or close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, facingMode]);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Flip camera (front/back)
  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  };

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    const currentStream = streamRef.current || stream;
    if (!currentStream) return;
    const track = currentStream.getVideoTracks()[0];
    if (track && torchSupported) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Failed to toggle torch:", e);
      }
    }
  };

  // 1. Take Photo
  const takePhoto = () => {
    if (!liveVideoRef.current) return;
    const video = liveVideoRef.current;
    
    // Create canvas matching video resolution
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob || blob.size === 0) return;
      const file = new File([blob], `rmix-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setCapturedFile(file);
      setCapturedBlobUrl(url);
      setCapturedType('image');
      stopCameraStream();
      setStep('review');
    }, 'image/jpeg', 0.95);
  };

  // Helper to get best supported video recording MIME type
  const getSupportedVideoMimeType = () => {
    const candidates = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    }
    return '';
  };

  // 2. Start Video Recording
  const startRecording = () => {
    const activeStream = streamRef.current || stream;
    if (!activeStream) {
      setCameraError("Camera stream not active. Please retry camera.");
      return;
    }
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    const selectedMime = getSupportedVideoMimeType();
    const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};

    try {
      const recorder = new MediaRecorder(activeStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || selectedMime || 'video/webm';
        const isMp4 = actualMime.includes('mp4');
        const cleanType = isMp4 ? 'video/mp4' : 'video/webm';
        const outputBlob = new Blob(recordedChunksRef.current, { type: cleanType });

        // STEP 3: Verify recorded Blob size is greater than zero
        if (recordedChunksRef.current.length === 0 || outputBlob.size === 0) {
          console.warn("Recorded video blob is 0 bytes");
          setCameraError("Recording was too short or produced no video data. Please try recording again.");
          setIsRecording(false);
          return;
        }

        const ext = isMp4 ? 'mp4' : 'webm';
        const file = new File([outputBlob], `rmix-${mode}-${Date.now()}.${ext}`, {
          type: cleanType,
          lastModified: Date.now(),
        });
        const url = URL.createObjectURL(outputBlob);
        setCapturedFile(file);
        setCapturedBlobUrl(url);
        setCapturedType('video');
        setIsRecording(false);
        stopCameraStream();
        setStep('review');
      };

      recorder.start(250);
      setIsRecording(true);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= maxRecordingSeconds) {
            stopRecording();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.warn("Failed to start MediaRecorder:", err);
      setCameraError(`Could not record video: ${err.message || 'MediaRecorder unsupported'}`);
    }
  };

  // 3. Stop Video Recording
  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Request final buffered data before stop
        mediaRecorderRef.current.requestData();
      } catch (e) {
        console.warn("requestData error:", e);
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Retake Media
  const handleRetake = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    setCapturedFile(null);
    setCapturedBlobUrl(null);
    setRecordingSeconds(0);
    setStep('capture');
  };

  // Handle custom music file upload
  const handleCustomAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert("Please select a valid audio file (MP3, WAV, AAC, M4A, OGG).");
      return;
    }

    const url = URL.createObjectURL(file);
    setUserCustomAudioFile(file);

    // Read audio duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      const dur = tempAudio.duration || 30;
      setMusicDuration(dur);
      setSelectedMusic({
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        author: "My Audio / Ringtone",
        duration: dur,
        blob: file,
        url,
        isPreset: false,
      });
      setShowMusicDrawer(false);
    };
  };

  // Synchronize Review Video and Music playback
  const togglePlayReview = () => {
    if (capturedType !== 'video') return;
    const v = reviewVideoRef.current;
    const a = musicAudioRef.current;

    if (!v) return;

    if (v.paused) {
      v.play().catch(() => {});
      if (a && selectedMusic) {
        a.currentTime = musicStartTime + v.currentTime;
        a.play().catch(() => {});
      }
      setIsPlayingPreview(true);
    } else {
      v.pause();
      if (a) a.pause();
      setIsPlayingPreview(false);
    }
  };

  // Automatically start review video playback when entering review step
  useEffect(() => {
    if (step === 'review' && capturedType === 'video' && capturedBlobUrl && reviewVideoRef.current) {
      const v = reviewVideoRef.current;
      v.src = capturedBlobUrl;
      v.load();
      v.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((err) => {
        console.log("Review video autoplay prevented:", err);
        setIsPlayingPreview(false);
      });
    }
  }, [step, capturedType, capturedBlobUrl]);

  // Update volume and sync playback
  useEffect(() => {
    if (reviewVideoRef.current) {
      reviewVideoRef.current.volume = isOriginalMuted ? 0 : originalVolume;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume;
    }
  }, [originalVolume, isOriginalMuted, musicVolume]);

  // Upload helper using Supabase Storage
  const uploadToStorage = async (
    file: File | Blob, 
    pathName: string, 
    contentType: string,
    onProgressUpdate?: (pct: number) => void
  ): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || supabaseAnonKey;

    // Supabase media storage RLS requires files to be located under the authenticated user's ID: ${user.id}/...
    const fullPath = pathName.startsWith(`${user.id}/`) ? pathName : `${user.id}/${pathName}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/media/${fullPath}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", supabaseAnonKey);
      xhr.setRequestHeader("Content-Type", contentType || 'application/octet-stream');
      xhr.setRequestHeader("x-upsert", "true");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgressUpdate) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgressUpdate(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fullPath);
          resolve(publicUrl);
        } else {
          let errMsg = `Upload failed with status ${xhr.status}`;
          try {
            const errJson = JSON.parse(xhr.responseText);
            if (errJson.message) errMsg = errJson.message;
          } catch {}
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => reject(new Error("Network connection error during media upload."));
      xhr.send(file);
    });
  };

  // Publish final post directly to Supabase
  const handlePublish = async () => {
    if (!capturedFile || capturedFile.size === 0) {
      setPublishError("Captured media is empty or invalid. Please retake.");
      return;
    }

    if (isPublishing) return; // Prevent duplicate submissions

    setIsPublishing(true);
    setPublishError(null);
    setPublishProgress(5);
    setPublishStatus("Preparing media & sound studio tracks...");

    try {
      let finalMediaFile = capturedFile;
      let finalAudioUrl: string | null = null;

      // 1. Audio Mixing for Video
      if (capturedType === 'video' && selectedMusic) {
        setPublishStatus("Mixing video & music at adjusted volumes...");
        setPublishProgress(15);

        // Attempt stream mixing if supported
        if (isStreamMixingSupported()) {
          try {
            const mixResult = await mixVideoWithAudio(
              capturedFile, 
              selectedMusic.blob || selectedMusic.url, 
              {
                originalVolume: isOriginalMuted ? 0 : originalVolume,
                musicVolume,
                musicStartTime,
                onProgress: (status) => setPublishStatus(status),
              }
            );

            if (mixResult && mixResult.mixedFile && mixResult.mixedFile.size > 0) {
              finalMediaFile = mixResult.mixedFile;
              setPublishStatus("Audio mixed successfully!");
            } else {
              console.warn("Mix returned empty file, preserving original recorded video");
            }
          } catch (e) {
            console.warn("Client-side mixing bypassed, fallback to audio metadata:", e);
          }
        }

        // Upload audio track as metadata/soundtrack
        setPublishStatus("Uploading background music track...");
        const audioUploadBlob = selectedMusic.blob || (userCustomAudioFile || null);
        if (audioUploadBlob && audioUploadBlob.size > 0) {
          const audioFileName = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`;
          const uploadedAudioUrl = await uploadToStorage(
            audioUploadBlob,
            audioFileName,
            'audio/wav'
          );
          finalAudioUrl = uploadedAudioUrl;
        }
      } else if (capturedType === 'image' && selectedMusic) {
        // Requirement 4: For photos, attach music track as post metadata. Do NOT treat photo as video.
        setPublishStatus("Attaching photo soundtrack...");
        const audioUploadBlob = selectedMusic.blob || (userCustomAudioFile || null);
        if (audioUploadBlob && audioUploadBlob.size > 0) {
          const audioFileName = `photo-audio-${Date.now()}-${Math.random().toString(36).substring(7)}.wav`;
          const uploadedAudioUrl = await uploadToStorage(
            audioUploadBlob,
            audioFileName,
            'audio/wav'
          );
          finalAudioUrl = uploadedAudioUrl;
        }
      }

      // 2. Upload Media File
      setPublishStatus(`Uploading ${capturedType === 'image' ? 'photo' : (mode === 'reel' ? 'reel' : 'video')}...`);
      const isMp4 = finalMediaFile.type.includes('mp4');
      const ext = capturedType === 'image' ? 'jpg' : (isMp4 ? 'mp4' : 'webm');
      const cleanContentType = capturedType === 'image' ? 'image/jpeg' : (isMp4 ? 'video/mp4' : 'video/webm');
      const mediaFileName = `${mode}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const mediaUrl = await uploadToStorage(
        finalMediaFile,
        mediaFileName,
        cleanContentType,
        (pct) => {
          setPublishProgress(20 + Math.round(pct * 0.65));
        }
      );

      if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
        throw new Error("Invalid media URL received after storage upload.");
      }

      // 3. Insert Post into Database
      setPublishStatus("Publishing post to your R.mix profile...");
      setPublishProgress(90);

      // Build caption
      let fullCaption = caption.trim();
      if (hashtags.trim()) {
        const formattedTags = hashtags
          .split(/[\s,]+/)
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
          .join(' ');
        fullCaption += `\n\n${formattedTags}`;
      }
      if (selectedMusic) {
        fullCaption += `\n🎵 Music: ${selectedMusic.name} (${selectedMusic.author})`;
      }

      const postType = capturedType === 'image' ? 'image' : (mode === 'reel' ? 'reel' : 'video');
      const mediaUrlString = JSON.stringify([mediaUrl]);

      const { data: newPostData, error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: fullCaption,
        media_url: mediaUrlString,
        type: postType,
        audio_url: finalAudioUrl,
      }).select(`*, profiles:user_id(id, username, full_name, avatar_url)`).single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setPublishProgress(100);
      setPublishStatus("Published to R.mix!");

      setTimeout(() => {
        if (onPostCreated) onPostCreated(newPostData);
        handleClose();
      }, 700);

    } catch (err: any) {
      console.warn("Studio publish error:", err);
      setPublishError(err.message || "Failed to publish post. Please check your network and try again.");
      setIsPublishing(false);
    }
  };

  // Close modal and cleanup
  const handleClose = () => {
    stopCameraStream();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    setStep('capture');
    setCapturedFile(null);
    setCapturedBlobUrl(null);
    setSelectedMusic(null);
    setCaption("");
    setHashtags("");
    setIsPublishing(false);
    setPublishProgress(0);
    setPublishError(null);
    onClose();
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl h-full sm:h-[92vh] sm:max-h-[850px] bg-zinc-950 border-0 sm:border border-zinc-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">

        {/* TOP BAR */}
        <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/80 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>R.mix Camera & Sound Studio</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PRO
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                {step === 'capture' && (isRecording ? `Recording ${mode.toUpperCase()}...` : `Live Camera • ${mode.toUpperCase()} Mode`)}
                {step === 'review' && "Sound Studio & Post Tuning"}
                {step === 'publish' && "Publish to R.mix"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'review' && (
              <button
                type="button"
                onClick={handleRetake}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              disabled={isPublishing}
              className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: CAPTURE VIEW */}
        {step === 'capture' && (
          <div className="flex-1 relative bg-black flex flex-col justify-between overflow-hidden">
            {/* Camera Viewport */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950">
              {/* Permission / Error State */}
              {cameraError ? (
                <div className="p-6 text-center max-w-md space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">Camera Permission Needed</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Try Again</span>
                    </button>
                    {onOpenStandardEditor && (
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          onOpenStandardEditor([], mode);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-bold text-xs text-zinc-300 transition-colors"
                      >
                        Upload from Device
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => {
                      liveVideoRef.current?.play().catch(() => {});
                    }}
                    className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                  />

                  {isInitializingCamera && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                      <p className="text-xs text-zinc-300 font-medium">Starting camera...</p>
                    </div>
                  )}
                </>
              )}

              {/* Reel 9:16 Aspect ratio guideline overlay */}
              {mode === 'reel' && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="aspect-[9/16] h-full border-2 border-dashed border-purple-500/40 rounded-2xl" />
                </div>
              )}

              {/* Torch & Camera Switch Floating Controls */}
              {!cameraError && !isRecording && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="p-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 shadow-lg active:scale-95 transition-all"
                      title="Flip Camera (Front/Rear)"
                    >
                      <FlipHorizontal className="w-5 h-5" />
                    </button>
                  )}
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-3 rounded-full backdrop-blur-md border shadow-lg active:scale-95 transition-all ${
                        torchOn 
                          ? 'bg-amber-500 text-black border-amber-400' 
                          : 'bg-black/60 hover:bg-black/80 text-white border-white/10'
                      }`}
                      title="Flash / Torch"
                    >
                      {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              )}

              {/* Active Recording Pill & Duration */}
              {isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-red-600/90 text-white px-4 py-1.5 rounded-full shadow-xl shadow-red-500/30 backdrop-blur">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span className="text-xs font-black tracking-wider uppercase">REC</span>
                  <span className="text-xs font-mono font-bold">{formatTime(recordingSeconds)} / {formatTime(maxRecordingSeconds)}</span>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-gradient-to-t from-black via-zinc-950/90 to-transparent space-y-4 z-20">
              {/* Mode Selector (Photo, Video, Reel) */}
              {!isRecording && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('photo')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                      mode === 'photo' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('video')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                      mode === 'video' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('reel')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                      mode === 'reel' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Reel
                  </button>
                </div>
              )}

              {/* Action Buttons: Shutter / Record */}
              <div className="flex items-center justify-center pb-2">
                {mode === 'photo' ? (
                  <button
                    type="button"
                    onClick={takePhoto}
                    disabled={!!cameraError || isInitializingCamera}
                    className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform shadow-2xl hover:scale-105 disabled:opacity-50"
                  >
                    <div className="w-14 h-14 rounded-full bg-white shadow-inner" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!!cameraError || isInitializingCamera}
                    className={`w-18 h-18 rounded-full border-4 p-1 flex items-center justify-center active:scale-95 transition-all shadow-2xl disabled:opacity-50 ${
                      isRecording 
                        ? 'border-red-500 bg-red-600/20 animate-pulse' 
                        : 'border-white hover:scale-105'
                    }`}
                  >
                    {isRecording ? (
                      <div className="w-8 h-8 rounded-lg bg-red-500 shadow-md" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red-600 shadow-inner" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & SOUND STUDIO VIEW */}
        {step === 'review' && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Media Player Area */}
            <div className="relative bg-black aspect-video sm:aspect-[16/10] max-h-[380px] w-full flex items-center justify-center overflow-hidden border-b border-zinc-800">
              {capturedType === 'image' && capturedBlobUrl && (
                <Image
                  src={capturedBlobUrl}
                  alt="Captured Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}

              {capturedType === 'video' && capturedBlobUrl && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={reviewVideoRef}
                    src={capturedBlobUrl}
                    controls
                    playsInline
                    loop
                    autoPlay
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlayingPreview(true)}
                    onPause={() => setIsPlayingPreview(false)}
                    onTimeUpdate={() => {
                      if (reviewVideoRef.current) {
                        setPreviewCurrentTime(reviewVideoRef.current.currentTime);
                      }
                    }}
                    onError={(e) => {
                      console.warn("Review video player error:", e);
                    }}
                  />
                </div>
              )}

              {/* Audio Player for Music Sync */}
              {selectedMusic && (
                <audio
                  ref={musicAudioRef}
                  src={selectedMusic.url}
                  loop
                />
              )}
            </div>

            {/* Sound Studio Controls */}
            <div className="p-4 space-y-4 bg-zinc-950 flex-1">
              
              {/* Music Selection Header */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        {capturedType === 'image' ? 'Attach Photo Soundtrack' : 'Background Music & Ringtone'}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {selectedMusic 
                          ? `${selectedMusic.name} • ${selectedMusic.author}` 
                          : "Select audio file from device or choose a royalty-free track"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMusicDrawer(!showMusicDrawer)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{selectedMusic ? "Change Music" : "Add Music"}</span>
                  </button>
                </div>

                {/* Music Drawer: Device Upload & Presets */}
                {showMusicDrawer && (
                  <div className="pt-2 border-t border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={musicFileInputRef}
                        onChange={handleCustomAudioSelect}
                        accept="audio/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => musicFileInputRef.current?.click()}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Select Audio From Device</span>
                      </button>
                      {selectedMusic && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMusic(null);
                            setShowMusicDrawer(false);
                          }}
                          className="px-3 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Royalty-Free Presets Grid */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                        Instant Royalty-Free Creator Tracks:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {royaltyFreePresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setSelectedMusic(preset);
                              setMusicDuration(preset.duration);
                              setShowMusicDrawer(false);
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                              selectedMusic?.id === preset.id
                                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <FileAudio className="w-4 h-4 shrink-0 text-purple-400" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{preset.name}</p>
                              <span className="text-[9px] text-zinc-500">{preset.author}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Mixer Controls (Volumes & Start Offset) */}
                {selectedMusic && (
                  <div className="pt-3 border-t border-zinc-800 space-y-3">
                    {/* Music Start Trim Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-zinc-400 mb-1">
                        <span>Music Starting Point</span>
                        <span>{formatTime(musicStartTime)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, musicDuration - 5)}
                        step={0.5}
                        value={musicStartTime}
                        onChange={(e) => setMusicStartTime(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Volume Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Music Volume */}
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                            <span>Music Volume</span>
                          </span>
                          <span>{Math.round(musicVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                          className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Original Video Audio Volume */}
                      {capturedType === 'video' && (
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                            <button
                              type="button"
                              onClick={() => setIsOriginalMuted(!isOriginalMuted)}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              {isOriginalMuted ? (
                                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              <span>Original Audio</span>
                            </button>
                            <span>{isOriginalMuted ? "MUTED" : `${Math.round(originalVolume * 100)}%`}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            disabled={isOriginalMuted}
                            value={isOriginalMuted ? 0 : originalVolume}
                            onChange={(e) => {
                              setOriginalVolume(parseFloat(e.target.value));
                              setIsOriginalMuted(false);
                            }}
                            className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-40"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Caption & Post Details Form */}
              <div className="space-y-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption or describe your creation..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#tags (e.g. #rmix #viral)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Video & Reels">Video & Reels</option>
                    <option value="Music">Music</option>
                    <option value="Photography">Photography</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Tech & AI">Tech & AI</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Error Message */}
              {publishError && (
                <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{publishError}</span>
                </div>
              )}

              {/* Publishing Progress Bar */}
              {isPublishing && (
                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-purple-300">
                    <span className="flex items-center gap-1.5 truncate">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-purple-400" />
                      <span>{publishStatus}</span>
                    </span>
                    <span>{publishProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${publishProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isPublishing}
                  className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-bold text-xs text-zinc-300 transition-colors"
                >
                  Retake
                </button>

                {onOpenStandardEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!capturedFile) return;
                      handleClose();
                      onOpenStandardEditor([capturedFile], mode, userCustomAudioFile);
                    }}
                    disabled={isPublishing}
                    className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-bold text-xs text-indigo-400 transition-colors"
                  >
                    Post Editor
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-black text-xs uppercase tracking-wider text-white shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publish {mode.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
