import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Paperclip, X, Trash2, Pause, Plus, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
interface MessageComposerProps {
  onSend: (text: string) => void;
  onSendVoice?: (file: File, duration: number, waveform: string) => void;
  onSendFiles?: (text: string, files: File[]) => void;
  onActivity: (activity: 'TYPING' | 'RECORDING' | 'UPLOADING' | 'NONE') => void;
  onStartRecording?: () => void;
  isSending?: boolean;
  disabled?: boolean;
  replyTo?: any; // To show reply preview above composer
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  placeholder?: string;
  isPrivateChat?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = React.memo(({
  onSend, onSendVoice, onSendFiles, onActivity, isSending = false, disabled = false, replyTo, onCancelReply, editMode, onCancelEdit, placeholder = "Type a message...", isPrivateChat = false
}) => {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>(Array(30).fill(10));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (editMode) {
      setText(editMode.content);
    } else {
      setText('');
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editMode]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 4000) return;
    
    setText(e.target.value);
    adjustHeight();

    // Typing Indicator Logic
    onActivity('TYPING');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onActivity('NONE');
    }, 2000);
  };

  const handleSend = useCallback(() => {
    if (isSending || disabled) return;
    
    if (selectedFiles.length > 0 && onSendFiles) {
      try {
        onSendFiles(text.trim(), selectedFiles);
        setText('');
        setSelectedFiles([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        onActivity('NONE');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      } catch (err) {
        console.error("Error sending files:", err);
      }
      return;
    }

    if (text.trim()) {
      try {
        onSend(text.trim());
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        onActivity('NONE');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      } catch (err) {
        console.error("Error in MessageComposer handleSend:", err);
      }
    }
  }, [text, selectedFiles, isSending, disabled, onSend, onSendFiles, onActivity]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return; // Ignore IME composition
      e.preventDefault();
      handleSend();
    }
  };

  // ---------------- RECORDING LOGIC ---------------- //

  const cleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.warn);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this environment");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      const updateWaveform = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArrayRef.current[i];
        }
        let average = sum / bufferLength;
        // Map average to height percentage (10 to 100)
        let height = Math.max(10, Math.min(100, (average / 128) * 100));
        
        setLiveWaveform(prev => {
          const next = [...prev];
          next.shift();
          next.push(height);
          return next;
        });
        
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      onActivity('RECORDING');
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Microphone permission denied or error:", err);
      toast.error("Microphone permission denied or unavailable");
    }
  };

  const stopRecording = (cancel: boolean = false) => {
    if (!mediaRecorderRef.current) return;
    
    // Define the onstop handler before stopping
    mediaRecorderRef.current.onstop = () => {
      if (!cancel && onSendVoice && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        // Generate a static waveform array representing the whole recording
        // For simplicity, we just use the last live waveform or a random approximation.
        // A true waveform extraction would read the whole buffer, but this is sufficient for UX.
        const waveformStr = JSON.stringify(liveWaveform);
        onSendVoice(file, recordingDuration, waveformStr);
      }
      cleanupRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      onActivity('NONE');
    };
    
    mediaRecorderRef.current.stop();
  };

  const togglePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.suspend();
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      return URL.createObjectURL(file);
    }
    return null; // for documents, we'll show an icon
  };

  return (
    <div className="flex flex-col shrink-0 px-4 sm:px-6 py-4 relative z-10 glass-surface border-t border-border/50">
      
      {/* Attachments Preview Box */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="flex items-center gap-3 overflow-x-auto pb-3 custom-scrollbar"
          >
            {selectedFiles.map((file, idx) => {
              const preview = getFilePreview(file);
              return (
                <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-border bg-black/40 flex items-center justify-center group">
                  {preview ? (
                    file.type.startsWith('image/') ? (
                      <img src={preview} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={preview} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/70 break-all p-1 text-center">{file.name.split('.').pop()?.toUpperCase()}</span>
                  )}
                  <button 
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-background/80 p-0.5 rounded-full text-foreground/90 hover:text-red-400 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reply or Edit Preview Box */}
      <AnimatePresence>
        {(replyTo || editMode) && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className={`flex items-center justify-between bg-black/20 rounded-t-xl px-4 py-2 border-l-2 ${editMode ? 'border-amber-500' : 'border-primary'} overflow-hidden`}
          >
            <div className="min-w-0">
              <span className={`text-[11px] font-bold ${editMode ? 'text-amber-500' : 'text-primary'} block`}>
                {editMode ? 'Editing message' : `Replying to ${replyTo?.senderName}`}
              </span>
              <span className="text-xs text-muted-foreground truncate block max-w-md">
                {editMode ? editMode.content : replyTo?.content}
              </span>
            </div>
            <button onClick={editMode ? onCancelEdit : onCancelReply} className="p-1 hover:bg-foreground/10 rounded-full transition-colors shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative flex items-end gap-2 transition-colors focus-within:border-primary/50 focus-within:bg-black/40 min-h-[52px] ${
        isPrivateChat 
        ? 'border-none p-0 bg-transparent' 
        : `bg-black/20 border border-border ${(replyTo || editMode) ? 'rounded-b-xl rounded-tr-xl' : 'rounded-2xl'} p-2`
      }`}>
        
        {isRecording ? (
          // RECORDING UI
          <div className="flex items-center w-full h-full gap-3 px-2">
            <button 
              onClick={() => stopRecording(true)}
              className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
              title="Cancel Recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-red-500 ${!isPaused && 'animate-pulse'}`} />
              <span className="text-sm font-medium w-10">{formatDuration(recordingDuration)}</span>
            </div>

            <div className="flex-1 flex items-center gap-[2px] h-8 justify-center overflow-hidden px-4">
              {liveWaveform.map((h, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-t-sm transition-all duration-75 ${isPaused ? 'bg-primary/30' : 'bg-primary'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <button 
              onClick={togglePauseResume}
              className="p-2 rounded-full text-muted-foreground hover:bg-foreground/10 transition-colors shrink-0"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Mic className="w-5 h-5 text-primary" /> : <Pause className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => stopRecording(false)}
              className={`p-2.5 rounded-full shadow-lg transition-colors shrink-0 ${isPrivateChat ? 'bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21]' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'}`}
              title="Send Voice Note"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        ) : (
          // NORMAL TEXT UI
          <>
            {isPrivateChat && (
              <button className="p-3 text-muted-foreground hover:text-foreground shrink-0 mb-0.5" title="Attach">
                <Plus className="w-6 h-6" />
              </button>
            )}

            <div className={`flex-1 flex items-end relative min-h-[52px] ${isPrivateChat ? 'bg-black/20 border border-white/5 rounded-[24px] px-1' : ''}`}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={handleFileSelect}
              />
              
              {isPrivateChat ? (
                <button 
                  onClick={() => {/* Emoji Picker Placeholder */}}
                  className="p-3 text-muted-foreground hover:text-foreground shrink-0 mb-0.5"
                  title="Emoji"
                  disabled={disabled || isSending}
                >
                  <Smile className="w-6 h-6" />
                </button>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors shrink-0 mb-1"
                  title="Attach File"
                  disabled={disabled || isSending}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              )}

              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isSending}
                className={`flex-1 max-h-[150px] bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/60 custom-scrollbar disabled:opacity-50 h-full ${isPrivateChat ? 'py-3.5 px-2 text-[15px]' : 'py-3.5 px-2 text-[15px]'}`}
                rows={1}
                style={{ minHeight: isPrivateChat ? '52px' : 'auto' }}
              />

              {!isPrivateChat && (
                <div className="flex items-center shrink-0 pr-1 mb-1">
                  {text.trim().length === 0 && selectedFiles.length === 0 ? (
                    <button 
                      type="button"
                      onClick={startRecording}
                      disabled={disabled || isSending}
                      className="p-2.5 rounded-full text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-50"
                      title="Voice Note"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      disabled={disabled || isSending}
                      className={`p-2.5 rounded-full transition-colors flex items-center justify-center ${
                        (text.trim().length > 0 || selectedFiles.length > 0) && !isSending && !disabled
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25' 
                          : 'bg-foreground/5 text-muted-foreground'
                      }`}
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-border/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {isPrivateChat && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-muted-foreground hover:text-foreground shrink-0 mb-0.5"
                  title="Attach File"
                  disabled={disabled || isSending}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              )}
            </div>

            {isPrivateChat && (
              <div className="flex items-center shrink-0 ml-1 mb-0.5">
                {text.trim().length === 0 && selectedFiles.length === 0 ? (
                  <button 
                    type="button"
                    onClick={startRecording}
                    disabled={disabled || isSending}
                    className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] shadow-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Voice Note"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    disabled={disabled || isSending}
                    className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] shadow-lg flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-black/50 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Char Limit Warning */}
      {!isRecording && text.length > 3800 && (
        <span className="text-[10px] text-red-400 absolute bottom-1 right-6">
          {text.length}/4000
        </span>
      )}
    </div>
  );
});

MessageComposer.displayName = 'MessageComposer';

