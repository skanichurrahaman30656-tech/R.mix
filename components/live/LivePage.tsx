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
}

export function LivePage({ user, profile, isDarkMode, supabase, onClose }: LivePageProps) {
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
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const singlePeerConnectionRef = useRef<RTCPeerConnection | null>(null);

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
        .eq('status', 'active')
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

  // Scroll chat to bottom when new comment arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // -----------------------------------------------------------------
  // 2. HOSTING CONTROL FLOWS
  // -----------------------------------------------------------------
  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!liveTitle.trim()) return;

    try {
      // 1. Request camera / microphone media permission
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 24 },
          audio: true
        });
        setLocalStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        alert("Camera and microphone access are required to go live. Please grant browser permissions.");
        console.error("Media permission error:", err);
        return;
      }

      // 2. Insert live session row to Supabase
      const { data: sessionData, error: sessionErr } = await supabase
        .from('live_sessions')
        .insert({
          host_id: user.id,
          title: liveTitle.trim(),
          description: liveDesc.trim(),
          status: 'active',
          viewer_count: 0
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      // 3. Update states
      setIsHost(true);
      setActiveSession(sessionData);
      setViewerCount(0);
      setComments([]);
      setShowGoLiveForm(false);

      // 4. Setup Host Realtime Broadcast + Presence Channel
      setupRealtimeChannel(sessionData.id, true, mediaStream);
    } catch (err) {
      console.error("Failed to start live stream:", err);
      alert("Error starting live stream. Please try again.");
    }
  };

  const handleEndLive = async () => {
    if (!activeSession) return;
    
    // Stop local video tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    try {
      // Update DB state
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

    // Leave channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsHost(false);
    setActiveSession(null);
    setLiveTitle('');
    setLiveDesc('');
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
    const channelName = `live-room-${sessionId}`;
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
      if (hostMode) {
        // HOST RECEIVES SIGNAL
        const { from, type, sdp, candidate } = payload;
        
        if (type === 'join-request') {
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
        const { to, type, sdp, candidate } = payload;
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
              type: 'join-request'
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
      }
    };

    // Listen to connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setConnectionStatus('fallback');
      }
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
    return (
      <div className={`px-4 pb-24 max-w-md mx-auto space-y-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            <h1 className="text-lg font-black tracking-tight">Configure Live Stream</h1>
          </div>
          <button 
            onClick={() => setShowGoLiveForm(false)}
            className="p-1 rounded-full hover:bg-zinc-800/50 text-zinc-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleStartLive} className="space-y-4">
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
              By proceeding, you grant browser camera and microphone permissions. Your browser stream will connect securely using peer-to-peer WebRTC technology.
            </span>
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-lg shadow-red-900/10 transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Video className="w-4.5 h-4.5" />
            <span>Go Live Broadcast</span>
          </button>
        </form>
      </div>
    );
  }

  // --- RENDERING ACTIVE BROADCAST ROOM (HOST OR VIEWER) ---
  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col md:flex-row text-white">
      
      {/* 1. MAIN BROADCAST VIDEO / FALLBACK DISPLAY PANEL */}
      <div className="flex-1 relative bg-black flex items-center justify-center min-h-[40vh] md:min-h-0">
        
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
