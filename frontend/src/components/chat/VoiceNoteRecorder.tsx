import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, Lock, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSendVoiceNote, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      setIsPaused(false);
      setIsLocked(false);
      setSlideOffset(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      /* console.error removed */
      toast.error('Could not access microphone');
    }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSendVoiceNote(audioBlob, duration);
      cleanup();
    };
    
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsLocked(false);
    setIsPaused(false);
    setDuration(0);
    setSlideOffset(0);
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isLocked || isRecording) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startRecording();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRecording || isLocked) return;
    
    const deltaX = startXRef.current - e.clientX;
    const deltaY = startYRef.current - e.clientY;

    if (deltaX > 20) {
      setSlideOffset(-deltaX);
      if (deltaX > 100) {
        cancelRecording();
      }
    } else {
      setSlideOffset(0);
    }

    if (deltaY > 50) {
      setIsLocked(true);
      setSlideOffset(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isRecording || isLocked) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    stopRecordingAndSend();
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && !isLocked && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center justify-end w-64 pointer-events-none z-10">
          <div className="flex items-center space-x-4 bg-white glass-surface rounded-full py-2 px-4 shadow border border-[var(--glass-border)] dark:border-gray-700 w-full"
               style={{ transform: `translateX(${slideOffset}px)` }}>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground w-12">{formatTime(duration)}</span>
            <div className="flex-1 text-sm text-muted-foreground text-right opacity-70 whitespace-nowrap">
               Slide to cancel
            </div>
          </div>
          <div className="absolute -top-10 right-4 flex flex-col items-center opacity-70 animate-bounce">
            <Lock className="w-4 h-4 text-muted-foreground mb-1" />
          </div>
        </div>
      )}

      {isRecording && isLocked && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-between bg-white glass-surface rounded-full py-1.5 px-3 shadow border border-[var(--glass-border)] dark:border-gray-700 min-w-[200px] z-10">
           <button onClick={cancelRecording} className="p-2 text-muted-foreground hover:text-red-500 rounded-full hover:glass-surface dark:hover:bg-white/5 transition-colors">
             <Trash2 className="w-4 h-4" />
           </button>
           
           <div className="flex items-center space-x-2">
             {!isPaused && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
             <span className="text-sm font-medium text-red-500">{formatTime(duration)}</span>
           </div>
           
           <div className="flex items-center space-x-1">
             <button onClick={togglePause} className="p-2 text-muted-foreground hover:text-primary rounded-full hover:glass-surface dark:hover:bg-white/5 transition-colors">
               {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
             </button>
             <button onClick={stopRecordingAndSend} className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors">
               <Send className="w-4 h-4" />
             </button>
           </div>
        </div>
      )}

      {!isLocked && (
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          disabled={disabled && !isRecording}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-500 text-white scale-125 shadow-lg touch-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
