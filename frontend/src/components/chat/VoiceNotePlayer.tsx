import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  waveform?: string;
  isMyMessage?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ audioUrl, duration: initialDuration, waveform, isMyMessage }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);

  useEffect(() => {
    if (!containerRef.current) return;

    let peaks: (Float32Array | number[])[] | undefined;
    if (waveform) {
      try {
        peaks = [JSON.parse(waveform)];
      } catch (e) {
        /* console.error removed */
      }
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isMyMessage ? '#C7D2FE' : '#D1D5DB', // indigo-200 vs gray-300
      progressColor: isMyMessage ? '#4F46E5' : '#4B5563', // indigo-600 vs gray-600
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 36,
      url: audioUrl,
      peaks: peaks,
    });

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', (time: number) => {
      setCurrentTime(time);
    });
    ws.on('seeking', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl, waveform, isMyMessage]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const changeSpeed = () => {
    if (wavesurferRef.current) {
      const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
      wavesurferRef.current.setPlaybackRate(nextSpeed);
      setPlaybackSpeed(nextSpeed);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`flex items-center space-x-3 w-64 md:w-full max-w-80 rounded-xl p-2 ${isMyMessage ? 'bg-primary/20 dark:bg-indigo-900/40' : 'glass-surface'}`}>
      <button 
        onClick={togglePlayPause} 
        className={`p-2 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
          isMyMessage 
            ? 'bg-primary/100 text-white hover:bg-indigo-600' 
            : 'bg-primary/20 text-primary hover:bg-primary/20 dark:bg-indigo-900/50 dark:text-primary'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </button>

      <div className="flex-1 flex flex-col justify-center overflow-hidden relative">
        {/* WaveSurfer Container */}
        <div ref={containerRef} className="w-full h-[36px]" />
        
        <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground dark:text-muted-foreground font-medium">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center space-x-2">
            <button 
              onClick={changeSpeed} 
              className="hover:text-primary transition-colors glass-surface px-1.5 rounded"
            >
              {playbackSpeed}x
            </button>
            <a 
              href={audioUrl} 
              download 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-primary transition-colors"
              title="Download"
            >
              <Download className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
