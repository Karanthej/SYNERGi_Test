import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  waveformStr?: string;
  isMe?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ audioUrl, duration, waveformStr, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveform = waveformStr ? JSON.parse(waveformStr) as number[] : Array(40).fill(10);
  
  // Normalize waveform to 0-100% for height
  const maxAmp = Math.max(...waveform, 1);
  const normalizedWaveform = waveform.map(v => (v / maxAmp) * 100);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [audioUrl, duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
    setCurrentTime(newTime);
  };

  const toggleSpeed = () => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    setPlaybackRate(rates[(currentIndex + 1) % rates.length]);
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2 max-w-[280px] rounded-[1.25rem] ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card/50 border border-white/5 rounded-bl-sm'}`}>
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
        {/* Waveform visualizer */}
        <div 
          className="flex items-end gap-[2px] h-8 cursor-pointer relative"
          onClick={handleSeek}
        >
          {normalizedWaveform.map((height, i) => {
            const isPlayed = (i / normalizedWaveform.length) * 100 <= progress;
            return (
              <div 
                key={i} 
                className={`w-1 rounded-t-sm transition-colors ${isPlayed ? (isMe ? 'bg-white' : 'bg-primary') : (isMe ? 'bg-white/30' : 'bg-primary/30')}`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
            );
          })}
        </div>

        {/* Timers & Speed */}
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-medium ${isMe ? 'text-white/70' : 'text-foreground/70'}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button 
            onClick={toggleSpeed}
            className={`text-[10px] font-bold transition-colors px-1.5 py-0.5 rounded ${isMe ? 'text-white hover:text-white/80 bg-white/10' : 'text-primary hover:text-primary/80 bg-primary/10'}`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
