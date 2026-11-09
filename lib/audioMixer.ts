// Audio Mixing and Royalty-Free Music Studio Library for R.mix
// Provides Web Audio API mixing, synthesizer presets, and audio export

export interface MusicTrackOption {
  id: string;
  name: string;
  author: string;
  duration: number;
  blob?: Blob;
  url: string;
  isPreset?: boolean;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length * blockAlign;
  const bufferLength = 44 + length;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  // Subchunk 1 (fmt)
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // Subchunk 2 (data)
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Cached presets
let cachedPresets: MusicTrackOption[] | null = null;

/**
 * Synthesizes high quality, 100% royalty-free creator audio tracks in memory
 * using Web Audio API OfflineAudioContext
 */
export async function getRoyaltyFreePresets(): Promise<MusicTrackOption[]> {
  if (cachedPresets) return cachedPresets;
  if (typeof window === 'undefined') return [];

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!AudioCtx || !OfflineCtx) return [];

  const sampleRate = 44100;
  const presets: { id: string; name: string; author: string; bpm: number; rootFreq: number; style: 'chill' | 'lofi' | 'pulse' | 'acoustic' }[] = [
    { id: 'preset_chill', name: 'Summer Chill', author: 'R.mix Royalty-Free', bpm: 105, rootFreq: 261.63, style: 'chill' },
    { id: 'preset_lofi', name: 'Lo-Fi Sunset', author: 'R.mix Royalty-Free', bpm: 85, rootFreq: 220.00, style: 'lofi' },
    { id: 'preset_pulse', name: 'Electronic Pulse', author: 'R.mix Royalty-Free', bpm: 124, rootFreq: 293.66, style: 'pulse' },
    { id: 'preset_acoustic', name: 'Acoustic Groove', author: 'R.mix Royalty-Free', bpm: 95, rootFreq: 329.63, style: 'acoustic' }
  ];

  const results: MusicTrackOption[] = [];

  for (const p of presets) {
    try {
      const duration = 16; // 16 seconds loopable track
      const offlineCtx = new OfflineCtx(2, sampleRate * duration, sampleRate);
      const beatLength = 60 / p.bpm;

      // Chord progression frequencies
      const chords = [
        [p.rootFreq, p.rootFreq * 1.25, p.rootFreq * 1.5], // I
        [p.rootFreq * 1.334, p.rootFreq * 1.668, p.rootFreq * 2], // IV
        [p.rootFreq * 1.5, p.rootFreq * 1.875, p.rootFreq * 2.25], // V
        [p.rootFreq * 1.125, p.rootFreq * 1.414, p.rootFreq * 1.68] // ii
      ];

      // Master output gain
      const master = offlineCtx.createGain();
      master.gain.value = 0.7;
      master.connect(offlineCtx.destination);

      // Lowpass filter for warm tone
      const filter = offlineCtx.createBiquadFilter();
      filter.type = p.style === 'lofi' ? 'lowpass' : 'peaking';
      filter.frequency.value = p.style === 'lofi' ? 1400 : 3000;
      filter.connect(master);

      // Render Chords & Melody
      const numBars = Math.floor(duration / (beatLength * 4));
      for (let bar = 0; bar < numBars; bar++) {
        const chord = chords[bar % chords.length];
        const barStart = bar * beatLength * 4;

        // Play chord tones
        chord.forEach((freq, idx) => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = p.style === 'pulse' ? 'sawtooth' : (p.style === 'lofi' ? 'triangle' : 'sine');
          osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1), barStart);

          // Envelope
          gain.gain.setValueAtTime(0.001, barStart);
          gain.gain.linearRampToValueAtTime(0.12, barStart + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, barStart + beatLength * 3.8);

          osc.connect(gain);
          gain.connect(filter);

          osc.start(barStart);
          osc.stop(barStart + beatLength * 4);
        });

        // Add rhythmic percussion/clicks for groove
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = barStart + beat * beatLength;

          // Bass kick on beat 0 and 2
          if (beat === 0 || beat === 2) {
            const kickOsc = offlineCtx.createOscillator();
            const kickGain = offlineCtx.createGain();
            kickOsc.frequency.setValueAtTime(120, beatTime);
            kickOsc.frequency.exponentialRampToValueAtTime(35, beatTime + 0.18);
            kickGain.gain.setValueAtTime(0.35, beatTime);
            kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.2);

            kickOsc.connect(kickGain);
            kickGain.connect(master);
            kickOsc.start(beatTime);
            kickOsc.stop(beatTime + 0.25);
          }

          // Snare / Hi-hat on beats 1 and 3
          if (beat === 1 || beat === 3) {
            const hatOsc = offlineCtx.createOscillator();
            const hatGain = offlineCtx.createGain();
            hatOsc.type = 'triangle';
            hatOsc.frequency.setValueAtTime(p.style === 'pulse' ? 800 : 450, beatTime);
            hatGain.gain.setValueAtTime(0.1, beatTime);
            hatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.08);

            hatOsc.connect(hatGain);
            hatGain.connect(filter);
            hatOsc.start(beatTime);
            hatOsc.stop(beatTime + 0.1);
          }
        }
      }

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);

      results.push({
        id: p.id,
        name: p.name,
        author: p.author,
        duration,
        blob: wavBlob,
        url,
        isPreset: true
      });
    } catch (err) {
      console.warn("Failed to generate preset audio track:", p.name, err);
    }
  }

  cachedPresets = results;
  return results;
}

/**
 * Check if browser supports MediaStream / captureStream re-encoding
 */
export function isStreamMixingSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
  const hasCaptureStream = !!(
    (HTMLMediaElement.prototype as any).captureStream ||
    (HTMLMediaElement.prototype as any).mozCaptureStream
  );
  return hasMediaRecorder && hasCaptureStream;
}

/**
 * Mixes a recorded video stream with selected background music audio track at user-adjusted volumes
 */
export async function mixVideoWithAudio(
  videoBlob: Blob,
  audioBlobOrUrl: Blob | string,
  options: {
    originalVolume: number; // 0 to 1
    musicVolume: number;    // 0 to 1
    musicStartTime?: number; // seconds
    onProgress?: (status: string) => void;
  }
): Promise<{ mixedBlob: Blob; mixedFile: File } | null> {
  if (typeof window === 'undefined') return null;

  if (!isStreamMixingSupported()) {
    return null; // Fallback to storing audio_url
  }

  const { originalVolume, musicVolume, musicStartTime = 0, onProgress } = options;

  return new Promise(async (resolve, reject) => {
    let videoEl: HTMLVideoElement | null = null;
    let audioEl: HTMLAudioElement | null = null;
    let audioCtx: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    const recordedChunks: Blob[] = [];

    const cleanup = () => {
      try {
        if (videoEl) {
          videoEl.pause();
          videoEl.src = '';
          videoEl.remove();
        }
        if (audioEl) {
          audioEl.pause();
          audioEl.src = '';
          audioEl.remove();
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    };

    try {
      if (onProgress) onProgress("Preparing video and music streams...");

      // 1. Create hidden video element
      videoEl = document.createElement('video');
      videoEl.style.position = 'fixed';
      videoEl.style.opacity = '0';
      videoEl.style.pointerEvents = 'none';
      videoEl.style.zIndex = '-9999';
      videoEl.crossOrigin = 'anonymous';
      videoEl.playsInline = true;
      videoEl.muted = false; // We connect to Web Audio API
      document.body.appendChild(videoEl);

      const videoUrl = URL.createObjectURL(videoBlob);
      videoEl.src = videoUrl;

      // 2. Create audio element for music
      audioEl = document.createElement('audio');
      audioEl.crossOrigin = 'anonymous';
      const audioUrl = typeof audioBlobOrUrl === 'string' 
        ? audioBlobOrUrl 
        : URL.createObjectURL(audioBlobOrUrl);
      audioEl.src = audioUrl;

      // Wait for both to be ready
      await Promise.all([
        new Promise((res) => {
          if (videoEl!.readyState >= 2) res(true);
          else videoEl!.onloadeddata = () => res(true);
        }),
        new Promise((res) => {
          if (audioEl!.readyState >= 2) res(true);
          else audioEl!.onloadeddata = () => res(true);
        })
      ]);

      const videoDuration = videoEl.duration || 10;
      audioEl.currentTime = Math.min(musicStartTime, Math.max(0, audioEl.duration - 0.5));

      // 3. Setup Web Audio API
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const dest = audioCtx.createMediaStreamDestination();

      // Video audio source & gain
      let videoSource: MediaElementAudioSourceNode | null = null;
      try {
        videoSource = audioCtx.createMediaElementSource(videoEl);
        const origGain = audioCtx.createGain();
        origGain.gain.value = Math.max(0, Math.min(1, originalVolume));
        videoSource.connect(origGain);
        origGain.connect(dest);
      } catch (err) {
        console.warn("Could not extract original video audio track (may be silent):", err);
      }

      // Music audio source & gain
      let musicSource: MediaElementAudioSourceNode | null = null;
      try {
        musicSource = audioCtx.createMediaElementSource(audioEl);
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = Math.max(0, Math.min(1, musicVolume));
        musicSource.connect(musicGain);
        musicGain.connect(dest);
      } catch (err) {
        console.warn("Could not connect music audio source:", err);
      }

      // 4. Capture Video stream from video element
      const captureStreamFn = (videoEl as any).captureStream || (videoEl as any).mozCaptureStream;
      if (!captureStreamFn) {
        cleanup();
        resolve(null);
        return;
      }

      const videoStream: MediaStream = captureStreamFn.call(videoEl);
      const videoTrack = videoStream.getVideoTracks()[0];
      const mixedAudioTrack = dest.stream.getAudioTracks()[0];

      if (!videoTrack) {
        cleanup();
        resolve(null);
        return;
      }

      const combinedStream = new MediaStream();
      combinedStream.addTrack(videoTrack);
      if (mixedAudioTrack) {
        combinedStream.addTrack(mixedAudioTrack);
      }

      // Choose supported MIME type
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      recorder = new MediaRecorder(combinedStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const isMp4 = mimeType.includes('mp4');
        const outputBlob = new Blob(recordedChunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
        const ext = isMp4 ? 'mp4' : 'webm';
        const mixedFile = new File([outputBlob], `rmix-studio-${Date.now()}.${ext}`, {
          type: isMp4 ? 'video/mp4' : 'video/webm',
          lastModified: Date.now()
        });

        cleanup();
        resolve({ mixedBlob: outputBlob, mixedFile });
      };

      recorder.onerror = (e) => {
        console.warn("MediaRecorder mixing error:", e);
        cleanup();
        resolve(null);
      };

      if (onProgress) onProgress("Synchronizing audio & rendering video...");

      recorder.start(100);
      await Promise.all([videoEl.play(), audioEl.play()]);

      // Progress reporting & timeout safety
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(99, Math.round((elapsed / videoDuration) * 100));
        if (onProgress) onProgress(`Mixing audio: ${pct}% complete`);
      }, 500);

      videoEl.onended = () => {
        clearInterval(interval);
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
      };

      // Safety timeout in case ended doesn't fire
      setTimeout(() => {
        clearInterval(interval);
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
      }, (videoDuration + 1.5) * 1000);

    } catch (err) {
      console.warn("Failed video-audio mixing process:", err);
      cleanup();
      resolve(null);
    }
  });
}
