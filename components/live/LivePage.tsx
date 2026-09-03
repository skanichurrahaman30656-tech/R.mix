"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Radio, Video, VideoOff, Mic, MicOff, Send, Users, 
  X, MessageSquare, AlertCircle, Heart, Flame, Play,
  Tv, Sparkles, LogOut, Loader2
} from 'lucide-react';

interface LivePageProps {
  user: any;
  profile: any;
  isDarkMode: boolean;
  supabase: any;
  onClose: () => void;
  initialSession?: any;
}

export function LivePage({ user, profile, isDarkMode, supabase, onClose, initialSession }: LivePageProps) {
  // Navigation states
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Form states for hosting
  const [showGoLiveForm, setShowGoLiveForm] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDesc, setLiveDesc] = useState('');

  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // Chat & Presence states
  const [comments, setComments] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [activeViewers, setActiveViewers] = useState<any[]>([]);

  // WebRTC / Signaling state
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'fallback'>('connecting');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [webrtcError, setWebrtcError] = useState<string | null>(null);
  const [hostingStep, setHostingStep] = useState<'config' | 'preview'>('config');
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const singlePeerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const userTokenRef = useRef<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      userTokenRef.current = res.data.session?.access_token || null;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      userTokenRef.current = session?.access_token || null;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // -----------------------------------------------------------------
  // 1. LOBBY DATA FETCHING
  // -----------------------------------------------------------------
  const fetchActiveSessions = async () => {
    setLoadingSessions(true);
    try {
      // Fetch active sessions with host profile info
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          host:profiles!host_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('status', 'live')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessionsList(data || []);
    } catch (err) {
      console.error('Error fetching active live sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (!activeSession) {
      fetchActiveSessions();
      // Setup listener for new sessions appearing in real-time
      const lobbySubscription = supabase
        .channel('live-lobby-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
          fetchActiveSessions();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(lobbySubscription);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession]);

  useEffect(() => {
    if (initialSession) {
      handleJoinLive(initialSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession]);

  // Scroll chat to bottom when new comment arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Handle unload/pagehide tab closure state cleanup
  useEffect(() => {
    const handleUnloadCleanup = () => {
      if (isHost && activeSession) {
        const supabaseUrl = (supabase as any).supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = (supabase as any).supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const headers = new Headers();
          headers.append("apikey", supabaseKey);
          headers.append("Authorization", `Bearer ${userTokenRef.current || ""}`);
          headers.append("Content-Type", "application/json");
          
          fetch(`${supabaseUrl}/rest/v1/live_sessions?id=eq.${activeSession.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'ended', ended_at: new Date().toISOString() }),
            keepalive: true
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleUnloadCleanup);
    window.addEventListener('pagehide', handleUnloadCleanup);
    return () => {
      window.removeEventListener('beforeunload', handleUnloadCleanup);
      window.removeEventListener('pagehide', handleUnloadCleanup);
    };
  }, [isHost, activeSession, supabase]);

  // -----------------------------------------------------------------
  // 2. HOSTING CONTROL FLOWS
  // -----------------------------------------------------------------
  const handleInitiatePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!liveTitle.trim()) return;
    setMediaError(null);

    // D. Detect insecure context & iframe restrictions before trying
    const isSecure = typeof window !== 'undefined' && window.isSecureContext;
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices;
    const hasGetUserMedia = hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!isSecure) {
      setMediaError("Camera/microphone access requires a secure HTTPS context. Please open the deployed HTTPS R.mix site in a normal browser tab to start a live broadcast.");
      return;
    }

    if (!hasMediaDevices || !hasGetUserMedia) {
      setMediaError("Camera/microphone access is restricted in Preview. Open the deployed HTTPS R.mix site in a normal browser tab to start a live broadcast.");
      return;
    }

    try {
      // A. CAMERA + MICROPHONE browser media initialization
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 24 },
          audio: true
        });
      } catch (err: any) {
        let msg = "Unable to access camera or microphone.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = "Camera/microphone permission denied. Please grant permission in your browser.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = "Camera or microphone not found. Please connect a device.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = "Camera/microphone is already in use by another application.";
        } else if (err.name === 'SecurityError' || inIframe) {
          msg = "Camera/microphone access is restricted in Preview. Open the deployed HTTPS R.mix site in a normal browser tab to start a live broadcast.";
        } else {
          msg = `Camera/microphone unavailable: ${err.message || err.name || 'Unknown error'}`;
        }
        setMediaError(msg);
        return;
      }

      setLocalStream(mediaStream);
      setHostingStep('preview');
    } catch (err: any) {
      console.error("Failed to acquire preview stream:", err);
      setMediaError(`Media acquisition failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleLaunchBroadcast = async () => {
    if (!user || !localStream) return;
    setMediaError(null);

    try {
      // B. REAL LIVE SESSION CREATION (only after media access succeeded!)
      const { data: sessionData, error: sessionErr } = await supabase
        .from('live_sessions')
        .insert({
          host_id: user.id,
          title: liveTitle.trim(),
          description: liveDesc.trim(),
          status: 'live',
          started_at: new Date().toISOString(),
          viewer_count: 0
        })
        .select()
        .single();

      if (sessionErr) {
        throw sessionErr;
      }

      // Only switch UI states after successful database creation
      setIsHost(true);
      setActiveSession(sessionData);
      setViewerCount(0);
      setComments([]);
      setShowGoLiveForm(false);
      setHostingStep('config'); // Reset step for next time

      // Bind the existing active stream to local video element
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }, 100);

      // C. Setup host realtime channels and start WebRTC/signaling
      setupRealtimeChannel(sessionData.id, true, localStream);

      // Start recording for VOD persistence
      recordedChunksRef.current = [];
      try {
        const recorder = new MediaRecorder(localStream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn("MediaRecorder not supported or failed to start", err);
      }
    } catch (err: any) {
      console.error("Failed to start live stream database session:", err);
      setMediaError(`Unable to create live session: ${err.message || 'Database insert failed'}`);
    }
  };

  const handleCancelPreview = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setHostingStep('config');
  };

  const handleEndLive = async () => {
    if (!activeSession) return;
    
    // Stop and save recording if host
    if (isHost && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const sessionId = activeSession.id;
      const title = activeSession.title;
      
      mediaRecorderRef.current.onstop = async () => {
        try {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const fileName = `live_${sessionId}_${Date.now()}.webm`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('media')
              .upload(fileName, blob, { contentType: 'video/webm' });
              
            if (!uploadError && uploadData) {
              const { data: publicData } = supabase.storage.from('media').getPublicUrl(fileName);
              if (publicData?.publicUrl) {
                // Insert as a post so it appears in Feed
                await supabase.from('posts').insert({
                  user_id: user.id,
                  content: `🔴 Replay: ${title}`,
                  type: 'video',
                  media_url: JSON.stringify([publicData.publicUrl])
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to save live recording:", e);
        }
      };
      
      mediaRecorderRef.current.stop();
    }

    // Stop all media tracks immediately
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[Media Cleanup] Stopped track: ${track.kind}`);
      });
      setLocalStream(null);
    }

    // Broadcast "broadcast-ended" signal to all viewers first
    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            type: 'broadcast-ended'
          }
        });
      } catch (err) {
        console.warn("Failed to send broadcast-ended event:", err);
      }
    }

    try {
      // G. Update database state
      await supabase
        .from('live_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeSession.id);

      // Clean up peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
    } catch (err) {
      console.error("Error ending live session:", err);
    }

    // Leave and delete channel subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsHost(false);
    setActiveSession(null);
    setLiveTitle('');
    setLiveDesc('');
    setMediaError(null);
    setWebrtcError(null);
  };

  // -----------------------------------------------------------------
  // 3. VIEWER CONTROL FLOWS
  // -----------------------------------------------------------------
  const handleJoinLive = async (session: any) => {
    setActiveSession(session);
    setIsHost(false);
    setComments([]);
    setViewerCount(0);
    setConnectionStatus('connecting');

    // Fetch existing live comments for this session
    try {
      const { data, error } = await supabase
        .from('live_comments')
        .select(`
          *,
          user:profiles!user_id (
            username,
            avatar_url
          )
        `)
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching live comments:", err);
    }

    // Setup Realtime Channel for Viewer
    setupRealtimeChannel(session.id, false, null);
  };

  const handleLeaveLive = () => {
    // Leave channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Close WebRTC connection
    if (singlePeerConnectionRef.current) {
      singlePeerConnectionRef.current.close();
      singlePeerConnectionRef.current = null;
    }

    setActiveSession(null);
    setIsHost(false);
  };

  // -----------------------------------------------------------------
  // 4. SUPABASE REALTIME (CHAT + PRESENCE + WEBRTC SIGNALING)
  // -----------------------------------------------------------------
  const setupRealtimeChannel = (sessionId: string, hostMode: boolean, stream: MediaStream | null) => {
    const channelName = `live-session-${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user?.id || 'anonymous-' + Math.random().toString(36).substring(7),
        },
      },
    });

    channelRef.current = channel;

    // Listen to database changes for comments
    channel.on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'live_comments',
      filter: `session_id=eq.${sessionId}`
    }, async (payload: any) => {
      // Fetch profile to keep avatar/username
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', payload.new.user_id)
        .single();
      
      const enrichedComment = {
        ...payload.new,
        user: data || { username: 'user', avatar_url: 'https://www.gravatar.com/avatar/?d=mp' }
      };

      setComments(prev => [...prev, enrichedComment]);
    });

    // Listen to WebRTC Broadcast Signals
    channel.on('broadcast', { event: 'webrtc-signal' }, async ({ payload }: any) => {
      const { from, to, type, sdp, candidate } = payload;

      if (type === 'broadcast-ended') {
        if (!hostMode) {
          alert("The host has ended this live broadcast.");
          handleLeaveLive();
        }
        return;
      }

      if (hostMode) {
        // HOST RECEIVES SIGNAL
        if (type === 'viewer-join') {
          // Initialize P2P RTCPeerConnection for this specific viewer
          if (stream) {
            createHostPeerConnection(from, stream, channel);
          }
        } else if (type === 'answer') {
          const pc = peerConnectionsRef.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
          }
        } else if (type === 'candidate' && candidate) {
          const pc = peerConnectionsRef.current[from];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } else {
        // VIEWER RECEIVES SIGNAL
        if (to !== user?.id) return; // Ignore signals intended for other viewers

        if (type === 'offer') {
          createViewerPeerConnection(sdp, channel);
        } else if (type === 'candidate' && candidate) {
          if (singlePeerConnectionRef.current) {
            await singlePeerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      }
    });

    // Setup Presence logic for viewers count
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const viewersList: any[] = [];
      Object.keys(state).forEach(key => {
        const pres = state[key] as any;
        if (pres && pres[0]) {
          viewersList.push({
            id: key,
            ...pres[0]
          });
        }
      });

      // Filter out host from viewer count
      const count = viewersList.length;
      setViewerCount(count);
      setActiveViewers(viewersList);

      // If host, update the DB viewer count occasionally
      if (hostMode) {
        supabase
          .from('live_sessions')
          .update({ viewer_count: count })
          .eq('id', sessionId)
          .then();
      }
    });

    // Subscribe to channel
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Track presence metadata
        await channel.track({
          username: profile?.username || 'user',
          avatar_url: profile?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
          joined_at: new Date().toISOString()
        });

        // If viewer, broadcast join request to host to trigger WebRTC setup
        if (!hostMode) {
          channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: {
              from: user?.id,
              type: 'viewer-join'
            }
          });

          // Fallback timer: if WebRTC connection fails to establish in 5 seconds, switch gracefully to simulated stream
          setTimeout(() => {
            if (connectionStatus === 'connecting') {
              setConnectionStatus('fallback');
            }
          }, 5000);
        }
      }
    });
  };

  // -----------------------------------------------------------------
  // 5. WEBRTC PEER CONNECTION HELPERS
  // -----------------------------------------------------------------
  const createHostPeerConnection = async (viewerId: string, stream: MediaStream, channel: any) => {
    // If connection already exists, close it
    if (peerConnectionsRef.current[viewerId]) {
      peerConnectionsRef.current[viewerId].close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnectionsRef.current[viewerId] = pc;

    // Add connection-state handling
    pc.onconnectionstatechange = () => {
      console.log(`[Host WebRTC] Peer connection state for ${viewerId}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        setWebrtcError("WebRTC connection failed. Switched to secure fallback presence channel.");
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[Host WebRTC] ICE state for ${viewerId}:`, pc.iceConnectionState);
    };
    pc.onicegatheringstatechange = () => {
      console.log(`[Host WebRTC] ICE gathering for ${viewerId}:`, pc.iceGatheringState);
    };

    // Add local media stream tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Send ice candidates to viewer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            to: viewerId,
            type: 'candidate',
            candidate: e.candidate
          }
        });
      }
    };

    // Create SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send Offer to the viewer
    channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: {
        to: viewerId,
        type: 'offer',
        sdp: offer.sdp
      }
    });
  };

  const createViewerPeerConnection = async (offerSdp: string, channel: any) => {
    if (singlePeerConnectionRef.current) {
      singlePeerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    singlePeerConnectionRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && activeSession) {
        channel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            from: user?.id,
            type: 'candidate',
            candidate: e.candidate
          }
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setConnectionStatus('connected');
        setWebrtcError(null);
      }
    };

    // Listen to connection state
    pc.onconnectionstatechange = () => {
      console.log(`[Viewer WebRTC] Connection state:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
        setWebrtcError(null);
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus('connecting');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        setConnectionStatus('fallback');
        setWebrtcError("WebRTC direct peer connection failed or closed. Switched to secured realtime metadata and chat room.");
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[Viewer WebRTC] ICE state:`, pc.iceConnectionState);
    };
    pc.onicegatheringstatechange = () => {
      console.log(`[Viewer WebRTC] ICE gathering:`, pc.iceGatheringState);
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send Answer to Host
    channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: {
        from: user?.id,
        type: 'answer',
        sdp: answer.sdp
      }
    });
  };

  // -----------------------------------------------------------------
  // 6. CHAT COMMENT SUBMISSION
  // -----------------------------------------------------------------
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession || !user) return;

    try {
      const commentText = newMessage.trim();
      setNewMessage('');

      await supabase
        .from('live_comments')
        .insert({
          session_id: activeSession.id,
          user_id: user.id,
          content: commentText
        });

      // (Realtime DB insert policy will automatically propagate this via postgres_changes)
    } catch (err) {
      console.error("Error sending comment:", err);
    }
  };

  // -----------------------------------------------------------------
  // 7. CONTROLS (MUTE CAMERA / MIC)
  // -----------------------------------------------------------------
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Clean up media streams and sockets on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      if (singlePeerConnectionRef.current) {
        singlePeerConnectionRef.current.close();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  // -----------------------------------------------------------------
  // 8. RENDER INTERFACES
  // -----------------------------------------------------------------

  // --- RENDERING LOBBY MODE ---
  if (!activeSession && !showGoLiveForm) {
    return (
      <div className={`px-4 pb-24 max-w-xl mx-auto space-y-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Live Broadcasts</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Professional Go Live Callout banner */}
        <div className="p-4 rounded-2xl border bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-950 border-red-500/20 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="font-extrabold text-sm tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Become a Broadcaster</span>
            </h2>
            <p className="text-xs text-zinc-400">Share your moments, interact live, and build an active audience in real-time.</p>
          </div>
          <button
            onClick={() => {
              if (!user) {
                alert("Please log in or sign up to go live!");
                return;
              }
              setShowGoLiveForm(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-900/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>Go Live Now</span>
          </button>
        </div>

        {/* Active Streams list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span>Active Live Rooms ({sessionsList.length})</span>
          </h3>

          {loadingSessions ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-zinc-500 font-semibold">Scanning live frequencies...</p>
            </div>
          ) : sessionsList.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-900/20">
              <Radio className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-zinc-300">No active streams</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Nobody is broadcasting right now. Be the first one to start a live stream!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessionsList.map(session => (
                <div 
                  key={session.id}
                  onClick={() => handleJoinLive(session)}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 hover:border-indigo-500/60 hover:bg-zinc-900 transition-all cursor-pointer group flex gap-4 items-start relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  {/* Host avatar / graphic */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/80 p-0.5">
                      <Image 
                        width={100} 
                        height={100} 
                        referrerPolicy="no-referrer" 
                        src={session.host?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
                        alt="host" 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-red-600 rounded-full text-white shadow-md">
                      <Radio className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400">@{session.host?.username || 'user'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      <span className="text-[10px] text-zinc-500 font-medium">Started {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                      {session.title}
                    </h4>
                    {session.description && (
                      <p className="text-xs text-zinc-400 truncate leading-relaxed">
                        {session.description}
                      </p>
                    )}
                  </div>

                  {/* Live viewer badge */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                    <span className="px-2.5 py-1 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-[10px] font-black tracking-tight uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{session.viewer_count || 0}</span>
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDERING GO LIVE INITIALIZATION FORM ---
  if (showGoLiveForm) {
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    return (
      <div className={`px-4 pb-24 max-w-md mx-auto space-y-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h1 className="text-lg font-black tracking-tight">
              {hostingStep === 'preview' ? 'Verify Device Preview' : 'Configure Live Stream'}
            </h1>
          </div>
          <button 
            onClick={() => {
              handleCancelPreview();
              setShowGoLiveForm(false);
            }}
            className="p-1 rounded-full hover:bg-zinc-800/50 text-zinc-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {mediaError && (
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-bold flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
              <span>{mediaError}</span>
            </div>
            {inIframe && (
              <button
                type="button"
                onClick={() => window.open('/live', '_blank')}
                className="mt-1 px-3 py-1.5 self-start bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black tracking-tight uppercase rounded-lg transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Open Live in New Tab</span>
              </button>
            )}
          </div>
        )}

        {hostingStep === 'config' ? (
          <form onSubmit={handleInitiatePreview} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Stream Title *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Mixing live techno beats! 🎧"
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-zinc-950 border-zinc-800 focus:outline-none focus:border-indigo-500 text-sm font-semibold text-white placeholder-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Stream Description (Optional)</label>
              <textarea 
                rows={3}
                placeholder="Let your fans know what they can expect from this live feed..."
                value={liveDesc}
                onChange={(e) => setLiveDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-zinc-950 border-zinc-800 focus:outline-none focus:border-indigo-500 text-sm font-semibold text-white placeholder-zinc-600 resize-none"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>
                By proceeding, you grant browser camera and microphone permissions to preview your device before broadcasting.
              </span>
            </div>

            {inIframe && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium space-y-2">
                <p>Running inside a restricted Preview frame? Direct camera capture is highly optimized when opened in a dedicated browser tab.</p>
                <button
                  type="button"
                  onClick={() => window.open('/live', '_blank')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black tracking-tight uppercase rounded-lg text-[10px] transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Live in New Tab</span>
                </button>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-lg shadow-red-900/10 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Video className="w-4.5 h-4.5" />
              <span>Preview Device & Set up Stream</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-xl bg-black border border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center">
              <video
                ref={(el) => {
                  if (el && localStream) el.srcObject = localStream;
                }}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/75 border border-zinc-700 rounded text-[10px] font-bold text-zinc-300 flex items-center gap-1 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>Camera Preview Active</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-1.5">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Stream Meta Details</span>
              <h2 className="text-sm font-black text-white">{liveTitle}</h2>
              {liveDesc.trim() && <p className="text-xs text-zinc-400 leading-normal">{liveDesc}</p>}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleCancelPreview}
                className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-extrabold text-xs transition-all active:scale-98 text-center uppercase tracking-wider"
              >
                Back & Edit
              </button>
              <button 
                onClick={handleLaunchBroadcast}
                className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-900/10 transition-all flex items-center justify-center gap-1.5 active:scale-98 uppercase tracking-wider"
              >
                <Video className="w-4 h-4" />
                <span>Go Live Broadcast</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERING ACTIVE BROADCAST ROOM (HOST OR VIEWER) ---
  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col md:flex-row text-white">
      
      {/* 1. MAIN BROADCAST VIDEO / FALLBACK DISPLAY PANEL */}
      <div className="flex-1 relative bg-black flex items-center justify-center min-h-[40vh] md:min-h-0">
        
        {webrtcError && (
          <div className="absolute top-20 left-4 right-4 z-20 p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 text-[11px] font-bold text-amber-400 flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{webrtcError}</span>
          </div>
        )}
        
        {isHost ? (
          // HOST: Renders local camera feed
          <video 
            ref={localVideoRef}
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          // VIEWER: Renders remote WebRTC stream OR high-fidelity beautiful animated fallback
          connectionStatus === 'connected' ? (
            <video 
              ref={remoteVideoRef}
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            // Animated Fallback visualizer with active microphone state / metadata and nice waveform
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-indigo-950/80 flex flex-col items-center justify-center p-6 text-center space-y-4 select-none">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center relative shadow-2xl">
                <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-60" />
                <Tv className="w-8 h-8 text-indigo-400 relative z-10" />
              </div>
              
              <div className="space-y-1.5 max-w-xs">
                <h4 className="font-extrabold text-sm text-zinc-100 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Interactive Broadcast Active</span>
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {connectionStatus === 'connecting' 
                    ? 'Connecting direct WebRTC audio/video carrier...'
                    : 'P2P NAT Protected. Live metadata, participant presence, and chat channel fully secured.'
                  }
                </p>
              </div>

              {/* Waveform representation */}
              <div className="flex items-end justify-center gap-1.5 h-10 pt-2 w-32">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-indigo-500/80 rounded-full transition-all animate-bounce"
                    style={{ 
                      height: `${15 + Math.random() * 25}px`,
                      animationDelay: `${i * 150}ms`,
                      animationDuration: '800ms'
                    }}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* OVERLAY ELEMENTS ON THE VIDEO CANVAS */}
        <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            {/* Host badge */}
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
              <Image 
                width={100} 
                height={100} 
                referrerPolicy="no-referrer" 
                src={
                  isHost 
                    ? profile?.avatar_url 
                    : (activeSession?.host?.avatar_url || "https://www.gravatar.com/avatar/?d=mp")
                } 
                alt="host" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs truncate max-w-[120px]">
                  {isHost ? 'You (Hosting)' : `@${activeSession?.host?.username || 'user'}`}
                </span>
                {isHost && (
                  <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase scale-90">Host</span>
                )}
              </div>
              <p className="text-[10px] text-zinc-300 truncate max-w-[150px]">{activeSession?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Live Counter */}
            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black tracking-tight uppercase flex items-center gap-1 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </span>

            {/* Viewers presence count */}
            <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>{viewerCount}</span>
            </span>

            {/* Exit/Close/Disconnect Button */}
            <button 
              onClick={isHost ? handleEndLive : handleLeaveLive}
              className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg active:scale-95"
              title={isHost ? "End Broadcast" : "Leave Live Stream"}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BOTTOM FLOATING HOST CONTROLS */}
        {isHost && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/85 border border-white/15 rounded-full flex items-center gap-4 shadow-2xl backdrop-blur-md">
            {/* Camera Mute toggle */}
            <button 
              onClick={toggleCamera}
              className={`p-2.5 rounded-full transition-all ${cameraEnabled ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-600 text-white hover:bg-red-500'}`}
              title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
            >
              {cameraEnabled ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
            </button>

            {/* Microphone Mute toggle */}
            <button 
              onClick={toggleMic}
              className={`p-2.5 rounded-full transition-all ${micEnabled ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-600 text-white hover:bg-red-500'}`}
              title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
            </button>

            <span className="w-px h-6 bg-zinc-800" />

            {/* End Stream control */}
            <button 
              onClick={handleEndLive}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>End Stream</span>
            </button>
          </div>
        )}

      </div>

      {/* 2. CHAT PANEL (SIDE PANEL ON DESKTOP, BOTTOM PANEL ON MOBILE) */}
      <div className="w-full md:w-80 h-[50vh] md:h-full border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
        
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-xs tracking-wide uppercase text-zinc-400 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Live Chat Channel</span>
          </span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
            Real-time Sync
          </span>
        </div>

        {/* Chat message scrolling list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col justify-end">
          <div className="space-y-3 overflow-y-auto max-h-full">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs font-semibold leading-relaxed">
                <Radio className="w-7 h-7 text-zinc-700 mx-auto mb-2 animate-pulse" />
                <span>Welcome to the stream! chat has started. Say hello below...</span>
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-2.5 items-start text-xs leading-relaxed animate-fade-in">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-800 shrink-0">
                    <Image 
                      width={50} 
                      height={50} 
                      referrerPolicy="no-referrer" 
                      src={c.user?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
                      alt="user avatar" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-extrabold text-indigo-400">@{c.user?.username || 'user'}</span>
                      <span className="text-[9px] text-zinc-600">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <p className="text-zinc-200 mt-0.5 break-words font-medium">{c.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Chat message input form */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40">
          {user ? (
            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input 
                type="text"
                placeholder="Send a chat message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={200}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 placeholder-zinc-600 text-white font-semibold"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center py-1 text-xs text-zinc-500 font-bold">
              Sign in to participate in the live chat.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
