// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff, User,
  Volume2, Pause, Play, UserPlus, Search,
  SignalHigh, Maximize2, Minimize2, Building2, Loader2, Activity, Settings, Check, Mic2
} from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const CallTimer = () => {
  const callStartTime = useCallStore(state => state.callStartTime);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    if (!callStartTime) {
      setDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);
    setDuration(Math.floor((Date.now() - callStartTime) / 1000));
    return () => clearInterval(interval);
  }, [callStartTime]);

  return <>{formatDuration(duration)}</>;
};

const NetworkQualityIndicator = () => {
  const stats = useCallStore(state => state.networkStats);
  if (!stats) return null;

  const color = {
    Excellent: 'text-green-500 bg-green-500/10 border-green-500/20',
    Good: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    Fair: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    Poor: 'text-red-500 bg-red-500/10 border-red-500/20'
  }[stats.quality];

  const tooltip = `RTT: ${stats.rtt}ms | Jitter: ${stats.jitter}ms | Loss: ${stats.packetLoss.toFixed(1)}% | Bitrate: ${stats.bitrate}kbps`;

  return (
    <div title={tooltip} className={`flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-help transition-colors ${color}`}>
      <Activity className="w-3 h-3" /> 
      {stats.quality}
      {stats.relayUsed && <span className="opacity-75">(Relayed)</span>}
    </div>
  );
};

const DeviceSettings = () => {
  const { microphones, speakers } = useMediaDevices();
  const selectedMic = useCallStore(s => s.selectedMicrophoneId);
  const selectedSpeaker = useCallStore(s => s.selectedSpeakerId);
  const switchMicrophone = useCallStore(s => s.switchMicrophone);
  const switchSpeaker = useCallStore(s => s.switchSpeaker);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center justify-center gap-1.5 focus:outline-none group">
          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-white shadow-lg backdrop-blur-md">
            <Settings className="w-5 h-5 text-zinc-100 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[10px] font-medium text-zinc-300 group-hover:text-white transition-colors">
            Device
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-zinc-900/95 border-zinc-800 text-zinc-100 backdrop-blur-xl shadow-2xl rounded-xl" sideOffset={12}>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5"><Mic2 className="w-3.5 h-3.5" /> Microphone</h4>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {microphones.length === 0 ? <span className="text-[11px] text-zinc-500 px-2">No microphones found</span> : null}
              {microphones.map(m => (
                <button 
                  key={m.deviceId} 
                  onClick={() => switchMicrophone?.(m.deviceId)}
                  className={`text-[12px] text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-colors ${selectedMic === m.deviceId || (selectedMic === null && m.deviceId === 'default') ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span className="truncate pr-2">{m.label || 'Default Microphone'}</span>
                  {(selectedMic === m.deviceId || (selectedMic === null && m.deviceId === 'default')) && <Check className="w-3 h-3 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Speaker</h4>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {speakers.length === 0 ? <span className="text-[11px] text-zinc-500 px-2">No speakers found</span> : null}
              {speakers.map(s => (
                <button 
                  key={s.deviceId} 
                  onClick={() => switchSpeaker(s.deviceId)}
                  className={`text-[12px] text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-colors ${selectedSpeaker === s.deviceId || (selectedSpeaker === null && s.deviceId === 'default') ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span className="truncate pr-2">{s.label || 'Default Speaker'}</span>
                  {(selectedSpeaker === s.deviceId || (selectedSpeaker === null && s.deviceId === 'default')) && <Check className="w-3 h-3 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({
  icon: Icon,
  label,
  onClick,
  variant = 'glass',
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'glass' | 'green' | 'red' | 'active';
}) {
  const base = 'flex flex-col items-center gap-1.5 cursor-pointer select-none';
  const btnClass = {
    glass: 'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 hover:brightness-110',
    green: 'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 hover:brightness-110 bg-green-500 shadow-[0_0_16px_rgba(34,197,94,0.5)]',
    red: 'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 hover:brightness-110 bg-destructive shadow-[0_0_16px_rgba(220,38,38,0.5)]',
    active: 'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 hover:brightness-110 bg-primary shadow-lg',
  }[variant];

  const glassBg = {
    glass: 'bg-foreground/5 dark:bg-white/10 text-foreground dark:text-white backdrop-blur-md border border-border',
    green: 'text-white',
    red: 'text-white',
    active: 'text-primary-foreground',
  }[variant];

  return (
    <div className={base} onClick={onClick}>
      <div className={`${btnClass} ${glassBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

interface CallOverlayProps {
  mode?: 'docked' | 'center_popup' | 'mini_floating' | 'hidden';
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ mode = 'hidden' }) => {
  const {
    callState, activePeer, isMuted, isRemoteMuted,
    isOnHold, isSpeakerOn, answerCall, rejectCall, endCall,
    toggleMute, toggleHold, toggleSpeaker, activeWorkspaceName, activeWorkspaceId,
    setManuallyMinimized, setUIMode, isCaller, initiateCallByUsername,
    isPoorConnection, isDiagnosticsOpen, hasHeldCall
  } = useCallStore();

  const miniFloatingPosition = useCallStore(s => s.miniFloatingPosition);
  const setMiniFloatingPosition = useCallStore(s => s.setMiniFloatingPosition);

  const [dialUsername, setDialUsername] = React.useState('');
  const [isDialing, setIsDialing] = React.useState(false);
  const [showDialer, setShowDialer] = React.useState(false);

  if (callState === 'IDLE' || !activePeer || mode === 'hidden') return null;

  const isIncoming = !isCaller && ['RINGING', 'WAITING', 'INITIATED'].includes(callState);
  const isConnected = ['CONNECTED'].includes(callState);
  const isConnecting = ['ACCEPTED', 'CONNECTING', 'NEGOTIATING', 'ICE_GATHERING', 'ICE_CONNECTED', 'RECONNECTING'].includes(callState);
  const isCalling = isCaller && ['INITIATED', 'RINGING', 'WAITING'].includes(callState);

  const peerName = activePeer?.name ?? 'Unknown Caller';
  const peerUsername = activePeer?.username;
  const peerAvatar = activePeer?.profileUrl ? getImageUrl(activePeer.profileUrl) : null;

  // ── DOCKED PANEL (Right Side in Team Chat) ──────────────────────────────────
  if (mode === 'docked') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="flex flex-col h-full w-full glass-surface relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">Voice Call</span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md tracking-wider">HD</span>
            </div>
            {isConnected && (
              <button onClick={() => { setManuallyMinimized(true); setUIMode('mini_floating'); }} className="p-1.5 text-muted-foreground hover:bg-foreground/5 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center px-6 pb-6 overflow-y-auto no-scrollbar pt-8">
            
            {activeWorkspaceName && (
               <div className="flex items-center gap-2 mb-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                 <Building2 className="w-3.5 h-3.5" />
                 {activeWorkspaceName}
               </div>
            )}

            {/* Avatar */}
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 scale-[1.3] rounded-full border border-primary/20" />
              <div className="absolute inset-0 scale-[1.6] rounded-full border border-primary/10" />

              <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative z-10 border-[3px] border-background shadow-lg transition-all duration-500 ${isOnHold ? 'grayscale opacity-60' : ''}`}>
                {peerAvatar ? (
                  <img src={peerAvatar} alt={peerName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>

              {isIncoming && !isCalling && (
                <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />
              )}
              {isRemoteMuted && isConnected && (
                <div className="absolute bottom-0 right-0 z-20 bg-background text-foreground rounded-full p-1 border border-border shadow-sm">
                  <MicOff className="w-4 h-4" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight text-center">{peerName}</h3>
            {peerUsername && (
              <div className="text-sm text-muted-foreground font-medium mb-1">@{peerUsername}</div>
            )}

            {isPoorConnection && (
              <div className="flex items-center justify-center gap-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-3 py-1 rounded-full mb-3 text-[11px] font-semibold border border-yellow-500/20">
                <SignalHigh className="w-3.5 h-3.5" /> Poor Network Connection
              </div>
            )}

            <div className="flex justify-center mb-3">
              <NetworkQualityIndicator />
            </div>

            <div className="text-[13px] text-muted-foreground mb-3 font-medium text-center">
              {callState === 'MISSED' ? 'Call Missed' :
               callState === 'REJECTED' ? 'Call Declined' :
               callState === 'BUSY' ? 'User Busy' :
               callState === 'ENDED' ? 'Call Ended' :
               callState === 'FAILED' ? 'Call Failed' :
               isOnHold
                ? '⏸ Call on hold'
                : isConnected
                  ? <CallTimer />
                  : isConnecting
                    ? callState === 'RECONNECTING' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin"/> Reconnecting...</span> : 'Connecting...'
                    : isIncoming
                      ? 'Incoming Call...'
                      : 'Calling...'}
            </div>

            {isConnected && !isOnHold && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold mb-8 border border-green-500/20">
                <SignalHigh className="w-3.5 h-3.5" />
                Good Connection
              </div>
            )}
            
            {/* Controls */}
            {(isConnected || isCalling) && (
              <div className="flex flex-col gap-4 mt-auto w-full pt-4 mb-6">
                
                {showDialer && (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="flex items-center gap-2 bg-background/50 border border-border p-2 rounded-xl w-full">
                        <Search className="w-4 h-4 text-muted-foreground ml-2" />
                        <input 
                            type="text" 
                            placeholder="Type username..." 
                            value={dialUsername}
                            onChange={(e) => setDialUsername(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground"
                            autoFocus
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && dialUsername && activeWorkspaceId) {
                                    setIsDialing(true);
                                    await initiateCallByUsername?.(dialUsername, activeWorkspaceId);
                                    setIsDialing(false);
                                    setShowDialer(false);
                                    setDialUsername('');
                                }
                            }}
                        />
                        <button 
                            disabled={!dialUsername || isDialing}
                            onClick={async () => {
                                if (dialUsername && activeWorkspaceId) {
                                    setIsDialing(true);
                                    await initiateCallByUsername?.(dialUsername, activeWorkspaceId);
                                    setIsDialing(false);
                                    setShowDialer(false);
                                    setDialUsername('');
                                }
                            }} 
                            className="bg-primary text-primary-foreground p-1.5 rounded-lg disabled:opacity-50"
                        >
                            {isDialing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                        </button>
                    </motion.div>
                )}

                <div className="flex justify-center items-center gap-4 w-full">
                  <ActionBtn icon={isMuted ? MicOff : Mic} label={isMuted ? 'Unmute' : 'Mute'} variant={isMuted ? 'active' : 'glass'} onClick={toggleMute ?? undefined} />
                  <ActionBtn icon={Volume2} label="Speaker" variant={isSpeakerOn ? 'active' : 'glass'} onClick={toggleSpeaker ?? undefined} />
                  <ActionBtn icon={isOnHold ? Play : Pause} label={isOnHold ? "Resume" : "Hold"} variant={isOnHold ? 'active' : 'glass'} onClick={toggleHold ?? undefined} />
                  <ActionBtn icon={UserPlus} label="Add" variant={showDialer ? 'active' : 'glass'} onClick={() => setShowDialer(!showDialer)} />
                  <DeviceSettings />
                  <ActionBtn 
                     icon={Activity} 
                     label="Stats" 
                     variant={isDiagnosticsOpen ? 'active' : 'glass'} 
                     onClick={() => {
                       const state = useCallStore.getState();
                       state.setDiagnosticsOpen(!state.isDiagnosticsOpen);
                     }} 
                  />
                </div>
              </div>
            )}

            {isIncoming && !isCalling && (
              <div className="flex justify-center items-center gap-6 mt-auto w-full pt-8 mb-6">
                <ActionBtn icon={PhoneOff} label="Decline" variant="red" onClick={rejectCall ?? undefined} />
                <ActionBtn icon={Phone} label="Accept" variant="green" onClick={answerCall ?? undefined} />
              </div>
            )}

            {hasHeldCall && (isConnected || isCalling) && (
               <div className="w-full flex justify-center mt-4">
                  <button
                    onClick={() => {
                        // Ends current call which triggers processNextInQueue automatically resuming the held call
                        endCall?.();
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 rounded-full text-[11px] font-bold transition-colors"
                  >
                     <Pause className="w-3.5 h-3.5" />
                     Resume Held Call (Ends Current)
                  </button>
               </div>
            )}

            {(isConnected || isCalling || isConnecting) && (
              <button
                onClick={endCall ?? undefined}
                className="w-full max-w-[260px] mx-auto py-3 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white rounded-full font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-auto"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── CENTER POPUP (Different workspace or not in team chat) ─────────────────
  if (mode === 'center_popup') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-background border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col relative"
          >
            {/* Subtle incoming call glow */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

            <div className="p-8 flex flex-col items-center text-center relative z-10">
              
              {activeWorkspaceName && (
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-6 bg-primary/10 px-3 py-1 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  {activeWorkspaceName}
                </div>
              )}

              <div className="relative mb-4">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-[-8px] rounded-full border-2 border-primary/30" />
                <Avatar className="w-20 h-20 border-2 border-background shadow-xl relative z-10">
                  <AvatarImage src={peerAvatar || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{peerName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">{peerName}</h2>
              {peerUsername && <p className="text-sm text-muted-foreground mb-4">@{peerUsername}</p>}

              <p className="text-sm text-foreground/80 font-medium mb-8 animate-pulse">Incoming Call...</p>

              <div className="flex items-center justify-center gap-6 w-full">
                <button onClick={rejectCall ?? undefined} className="flex-1 py-3.5 bg-destructive hover:bg-destructive/90 text-white rounded-2xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                  <PhoneOff className="w-5 h-5" /> Decline
                </button>
                <button onClick={answerCall ?? undefined} className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" /> Accept
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── MINI FLOATING (Bottom Right for Background Calls) ───────────────────────
  if (mode === 'mini_floating') {
    return (
      <AnimatePresence>
        <motion.div
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => {
             setMiniFloatingPosition({
                x: (miniFloatingPosition?.x || 0) + info.offset.x,
                y: (miniFloatingPosition?.y || 0) + info.offset.y,
             });
          }}
          initial={{ opacity: 0, scale: 0.9, x: miniFloatingPosition?.x || 0, y: (miniFloatingPosition?.y || 0) + 50 }}
          animate={{ opacity: 1, scale: 1, x: miniFloatingPosition?.x || 0, y: miniFloatingPosition?.y || 0 }}
          exit={{ opacity: 0, scale: 0.9, y: (miniFloatingPosition?.y || 0) + 50, x: miniFloatingPosition?.x || 0 }}
          className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 bg-background border border-border shadow-2xl p-4 rounded-3xl w-80 cursor-move"
        >
          {/* Header & Workspace */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
             <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">
               <Building2 className="w-3.5 h-3.5" />
               <span className="truncate max-w-[120px]">{activeWorkspaceName || 'Workspace'}</span>
             </div>
             <button onClick={() => { setManuallyMinimized(false); setUIMode('docked'); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white" title="Return to Chat">
               <Maximize2 className="w-4 h-4" />
             </button>
          </div>

          {/* Profile Area */}
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setManuallyMinimized(false); setUIMode('docked'); }}>
             <div className="relative">
                 <Avatar className="w-14 h-14 border-2 border-border shadow-sm">
                    <AvatarImage src={peerAvatar || ''} />
                    <AvatarFallback>{peerName.charAt(0)}</AvatarFallback>
                 </Avatar>
                 {isConnected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                 )}
             </div>
             
             <div className="flex flex-col flex-1 min-w-0">
                <span className="text-base font-bold text-foreground truncate">{peerName}</span>
                {peerUsername && <span className="text-xs text-muted-foreground truncate">@{peerUsername}</span>}
                <span className="text-xs text-green-500 font-mono font-medium mt-0.5">
                  {callState === 'MISSED' ? 'Missed' :
                   callState === 'REJECTED' ? 'Declined' :
                   callState === 'BUSY' ? 'Busy' :
                   callState === 'ENDED' ? 'Ended' :
                   callState === 'FAILED' ? 'Failed' :
                   isOnHold ? 'On hold' :
                   isConnected ? <CallTimer /> : 
                   isConnecting ? (callState === 'RECONNECTING' ? 'Reconnecting...' : 'Connecting...') : 
                   'Calling...'}
                </span>
             </div>
          </div>

          {/* Dialer */}
          {showDialer && (
              <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="flex items-center gap-2 bg-background/50 border border-border p-2 rounded-xl w-full">
                  <Search className="w-4 h-4 text-muted-foreground ml-1" />
                  <input 
                      type="text" 
                      placeholder="Username..." 
                      value={dialUsername}
                      onChange={(e) => setDialUsername(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs flex-1 placeholder:text-muted-foreground"
                      autoFocus
                      onKeyDown={async (e) => {
                          if (e.key === 'Enter' && dialUsername && activeWorkspaceId) {
                              setIsDialing(true);
                              await initiateCallByUsername?.(dialUsername, activeWorkspaceId);
                              setIsDialing(false);
                              setShowDialer(false);
                              setDialUsername('');
                          }
                      }}
                  />
                  <button 
                      disabled={!dialUsername || isDialing}
                      onClick={async () => {
                          if (dialUsername && activeWorkspaceId) {
                              setIsDialing(true);
                              await initiateCallByUsername?.(dialUsername, activeWorkspaceId);
                              setIsDialing(false);
                              setShowDialer(false);
                              setDialUsername('');
                          }
                      }} 
                      className="bg-primary text-primary-foreground p-1.5 rounded-md disabled:opacity-50"
                  >
                      {isDialing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                  </button>
              </motion.div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-1.5">
                 <button onClick={toggleMute ?? undefined} className={`p-2.5 rounded-full transition-colors ${isMuted ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`} title={isMuted ? 'Unmute' : 'Mute'}>
                   {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 </button>
                 <button onClick={toggleSpeaker ?? undefined} className={`p-2.5 rounded-full transition-colors ${isSpeakerOn ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`} title="Speaker">
                   <Volume2 className="w-4 h-4" />
                 </button>
                 <button onClick={toggleHold ?? undefined} className={`p-2.5 rounded-full transition-colors ${isOnHold ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`} title={isOnHold ? "Resume" : "Hold"}>
                   {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                 </button>
                 <button onClick={() => setShowDialer(!showDialer)} className={`p-2.5 rounded-full transition-colors ${showDialer ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`} title="Add Call">
                   <UserPlus className="w-4 h-4" />
                 </button>
             </div>
             
             <button onClick={endCall ?? undefined} className="p-2.5 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-lg transition-colors flex items-center justify-center">
               <PhoneOff className="w-4 h-4" />
             </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};
