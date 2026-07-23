import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessageResponse } from '@/services/chatService';
import { Check, CheckCheck, Reply, Copy, Trash2, Smile, Edit2, Play, Forward, Pin, AlertCircle, Clock, FileText, Download, X } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import EmojiPicker from 'emoji-picker-react';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { MediaLightbox } from './MediaLightbox';

interface MessageBubbleProps {
  message: ChatMessageResponse;
  isMe: boolean;
  isRead: boolean;
  otherMemberAvatar?: string;
  tickStatus?: 'sending' | 'failed' | 'sent' | 'delivered' | 'read';
  onReply?: (msg: ChatMessageResponse) => void;
  onEdit?: (msg: ChatMessageResponse) => void;
  onDelete?: (msg: ChatMessageResponse) => void;
  onReact?: (emoji: string) => void;
  onForward?: (msg: ChatMessageResponse) => void;
  onPin?: () => void;
  onInfo?: (msg: ChatMessageResponse) => void;
  isHighlighted?: boolean;
  isFirstInSequence?: boolean;
  isLastInSequence?: boolean;
  isPrivateChat?: boolean;
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ 
  message, isMe, otherMemberAvatar, tickStatus, onReply, onEdit, onDelete, onReact, onForward, onPin, onInfo, isHighlighted,
  isFirstInSequence = true, isLastInSequence = true, isPrivateChat = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string, type: 'image' | 'video', fileName?: string } | null>(null);

  const isMediaOnly = !message.content && message.attachments && message.attachments.length > 0 && !message.isVoiceNote;

  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  
  if (message.content?.startsWith('$$CALL_LOG$$')) {
    const parts = message.content.split('|');
    const status = parts[1]; 
    const duration = parseInt(parts[2] || '0', 10);
    const m = Math.floor(duration / 60);
    const s = duration % 60;
    const durationStr = `${m}:${s.toString().padStart(2, '0')}`;
    const isMissed = status === 'MISSED' || status === 'REJECTED';
    
    // We import Phone from lucide-react, wait, is Phone imported? Let's check imports.
    // If not, we'll just use a generic icon or text.
    return (
      <div className={`flex w-full my-4 justify-center`} ref={containerRef}>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted backdrop-blur-md rounded-full border border-border text-xs shadow-sm">
          <span className={isMissed ? 'text-red-400' : 'text-green-400'}>📞</span>
          <span className="text-foreground/80 font-medium">
             {isMissed ? 'Missed Call' : `Call Ended • ${durationStr}`}
          </span>
          <span className="text-muted-foreground text-[10px] ml-1 font-mono">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isHighlighted && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    toast.success('Copied to clipboard');
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      className={`chat-message-bubble flex w-full group relative ${isPrivateChat ? (isLastInSequence ? 'pb-2' : 'pb-[2px]') : 'pb-3'} ${isMe ? 'justify-end' : 'justify-start'} ${message.isDeleted ? 'opacity-70' : ''} ${isHighlighted ? 'animate-pulse' : ''}`}
      data-message-uuid={message.uuid}
      data-sender-uuid={message.senderUuid}
    >
      {!isMe && !isPrivateChat && (
        <img 
          src={message.senderAvatarUrl ? getImageUrl(message.senderAvatarUrl) : (otherMemberAvatar ? getImageUrl(otherMemberAvatar) : '')} 
          alt={message.senderName} 
          className="w-8 h-8 rounded-full object-cover mr-2 self-end shrink-0 bg-foreground/5"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      
      <div className={`flex flex-col ${isMe ? 'items-end max-w-[80%]' : 'items-start max-w-[75%]'}`}>
        
        {/* Reply Preview */}
        {message.replyToMessageUuid && (
          <div className={`mb-1 text-xs opacity-70 px-2 border-l-2 ${isMe ? 'border-primary/50 text-right' : 'border-border/50'} flex items-center gap-1.5`}>
            <Reply className="w-3 h-3" />
            <span className="font-semibold">{message.replyToSenderName}:</span> 
            <span className="truncate max-w-[150px]">{message.replyToContent}</span>
          </div>
        )}

        {/* Pinned Indicator */}
        {message.isPinned && (
          <div className={`mb-1 text-xs text-primary flex items-center gap-1 opacity-80 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <Pin className="w-3 h-3" />
            <span className="font-semibold">Pinned</span>
          </div>
        )}

        <div className={`relative ${!isMediaOnly ? (isPrivateChat ? 'px-2 pt-1.5 pb-1 rounded-lg' : 'px-4 py-2.5 rounded-[1.25rem]') : ''} group break-words min-w-[60px] ${
          !isMediaOnly ? (
            isPrivateChat 
            ? (isMe ? `bg-[#005c4b] text-[#e9edef] ${isFirstInSequence ? 'rounded-tr-none' : ''}` : `bg-[#202c33] text-[#e9edef] ${isFirstInSequence ? 'rounded-tl-none' : ''}`)
            : (isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card/50 border border-white/5 rounded-bl-sm')
          ) : ''
        } ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} shadow-sm`}>
          {/* Action Toolbar */}
          <AnimatePresence>
            {showActions && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute top-0 -mt-10 ${isMe ? 'right-0' : 'left-0'} flex items-center bg-black/80 backdrop-blur-md rounded-lg shadow-xl border border-border z-10 px-1 py-1`}
              >
                <div className="relative">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title="React"><Smile className="w-3.5 h-3.5 text-foreground/80"/></button>
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-full mb-2 -left-10 z-50 shadow-2xl"
                        onMouseLeave={() => setShowEmojiPicker(false)}
                      >
                        <EmojiPicker 
                          theme={"dark" as any} 
                          onEmojiClick={(emojiData) => {
                            onReact?.(emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                          width={300}
                          height={400}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => onReply?.(message)} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title="Reply"><Reply className="w-3.5 h-3.5 text-foreground/80"/></button>
                <button onClick={() => onForward?.(message)} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title="Forward"><Forward className="w-3.5 h-3.5 text-foreground/80"/></button>
                <button onClick={handleCopy} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title="Copy"><Copy className="w-3.5 h-3.5 text-foreground/80"/></button>
                <button onClick={onPin} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title={message.isPinned ? "Unpin" : "Pin"}><Pin className={`w-3.5 h-3.5 ${message.isPinned ? 'text-primary' : 'text-foreground/80'}`}/></button>
                {isMe && <button onClick={() => onEdit?.(message)} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5 text-foreground/80"/></button>}
                {isMe && <button onClick={() => onInfo?.(message)} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors" title="Message Info"><AlertCircle className="w-3.5 h-3.5 text-foreground/80"/></button>}
                {isMe && <button onClick={() => onDelete?.(message)} className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors group/del" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400 group-hover/del:text-red-500"/></button>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Note Rendering */}
          {message.isDeleted ? (
            <p className="text-[14px] italic opacity-80 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              This message was deleted
            </p>
          ) : message.isVoiceNote ? (
            <VoiceMessagePlayer 
              audioUrl={message.attachments?.[0]?.fileUrl || ''} 
              duration={message.voiceNoteDuration || 0}
              waveformStr={message.voiceNoteWaveform}
              isMe={isMe}
            />
          ) : (
            <div className={`flex flex-col ${isPrivateChat ? 'relative' : ''}`}>
              {message.content && (
                isPrivateChat ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <p className="text-[14.5px] leading-[1.4] whitespace-pre-wrap">{message.content}</p>
                    <span className="w-12 h-1 invisible"></span> {/* Spacer for absolute timestamp */}
                  </div>
                ) : (
                  <p className="text-[15px] leading-[1.4] whitespace-pre-wrap mb-1">{message.content}</p>
                )
              )}
              
              {/* Attachments rendering */}
              {message.attachments && message.attachments.length > 0 && !message.isVoiceNote && (
                <div className={`mt-2 ${message.attachments.length > 1 ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}`}>
                  {message.attachments.map((att) => {
                    const isImage = att.fileType.startsWith('image/');
                    const isVideo = att.fileType.startsWith('video/');
                    const isOptimistic = att.fileUrl.startsWith('blob:');
                    
                      if (isImage || isVideo) {
                        return (
                          <div 
                            key={att.uuid} 
                            className={`relative overflow-hidden bg-black/20 cursor-pointer border border-border group rounded-[1.25rem] ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'} ${
                              isMediaOnly ? 'max-w-[280px] sm:max-w-[320px]' : 'max-w-full mt-2'
                            }`}
                            onClick={() => setLightbox({ url: att.fileUrl, type: isImage ? 'image' : 'video', fileName: att.fileName })}
                          >
                            {isImage ? (
                              <img src={isOptimistic ? att.fileUrl : getImageUrl(att.fileUrl)} alt={att.fileName} className="w-full h-auto object-cover max-h-[350px]" />
                            ) : (
                              <div className="relative w-full h-auto max-h-[350px]">
                                <video src={isOptimistic ? att.fileUrl : getImageUrl(att.fileUrl)} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                                  <Play className="w-8 h-8 text-foreground opacity-80" />
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-1.5 right-1.5 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[9px] font-medium text-foreground/90 shadow-sm">
                              {(att.fileSize / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        );
                    } else {
                      // Document
                      return (
                        <div key={att.uuid} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-white/5 min-w-[180px]">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground/90">{att.fileName}</p>
                            <p className="text-[10px] text-foreground/50">{(att.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          {!isOptimistic && (
                            <a 
                              href={getImageUrl(att.fileUrl)} 
                              download={att.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/70 transition-colors shrink-0"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Upload Progress Overlay */}
          {message.isUploading && (
            <div className="mt-2 flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-border">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${message.uploadProgress || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-medium opacity-80 shrink-0">{message.uploadProgress || 0}%</span>
              <button 
                onClick={() => message.abortController?.abort()}
                className="p-1 hover:bg-foreground/10 rounded-full text-red-400 shrink-0 transition-colors"
                title="Cancel Upload"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {message.isFailed && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> Upload failed
            </div>
          )}
          
          {/* Metadata Footer */}
          {/* Metadata Footer */}
          <div className={isPrivateChat 
              ? `flex items-center gap-1 select-none absolute bottom-1 right-2 text-white/60` 
              : `flex items-center gap-1 mt-1 shrink-0 select-none ${isMe ? (isMediaOnly ? 'justify-end text-foreground/80' : 'justify-end text-primary-foreground/70') : 'justify-start text-muted-foreground'}`
          }>
            {!isPrivateChat && <span className="text-[10px] font-medium tracking-wide">{formatTime(message.createdAt)}</span>}
            {message.isEdited && <span className={`text-[10px] italic ${isPrivateChat ? 'mr-1' : 'ml-1'}`}>(edited)</span>}
            {isPrivateChat && <span className="text-[10px] tracking-wide mt-0.5">{formatTime(message.createdAt)}</span>}
            
            {isMe && !message.isDeleted && (
              <span className={`cursor-pointer ${isPrivateChat ? 'ml-0.5 mt-0.5' : 'ml-0.5 mt-0.5'}`} onClick={() => onInfo?.(message)}>
                {tickStatus === 'sending' || message.status === 'sending' ? (
                  <Clock className={isPrivateChat ? "w-[11px] h-[11px] opacity-70" : "w-3 h-3 opacity-60"} />
                ) : tickStatus === 'failed' || message.status === 'failed' ? (
                  <AlertCircle className={isPrivateChat ? "w-[11px] h-[11px] text-red-400" : "w-3 h-3 text-red-400"} />
                ) : tickStatus === 'read' ? (
                  <CheckCheck className={isPrivateChat ? "w-[13px] h-[13px] text-[#53bdeb]" : "w-3 h-3 text-blue-400"} />
                ) : tickStatus === 'delivered' ? (
                  <CheckCheck className={isPrivateChat ? "w-[13px] h-[13px] opacity-70" : "w-3 h-3 opacity-60"} />
                ) : (
                  <Check className={isPrivateChat ? "w-[13px] h-[13px] opacity-70" : "w-3 h-3 opacity-60"} />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions Rendering */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {message.reactions.map((r, i) => {
              const hasReacted = user?.uuid && r.userUuids?.includes(user.uuid);
              return (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onReact?.(r.emoji)}
                  key={i} 
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${hasReacted ? 'bg-primary/20 border-primary/40 text-primary-foreground' : 'bg-card/80 border-border text-muted-foreground hover:bg-foreground/10'}`}
                >
                  <span className="text-sm">{r.emoji}</span>
                  <span className="opacity-90">{r.count}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {lightbox && (
        <MediaLightbox 
          url={lightbox.url} 
          type={lightbox.type} 
          fileName={lightbox.fileName}
          onClose={() => setLightbox(null)} 
        />
      )}
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

