import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Pause, Phone, PhoneForwarded } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';

export const CallWaitingOverlay: React.FC = () => {
  const { waitingCallSignal, setWaitingCallSignal, toggleHold, isOnHold } = useCallStore();

  if (!waitingCallSignal) return null;

  const handleHoldAndAccept = () => {
    if (!isOnHold && toggleHold) {
       toggleHold();
    }
    window.dispatchEvent(new CustomEvent('accept-hold-waiting-call', { detail: waitingCallSignal }));
    setWaitingCallSignal(null);
  };

  const handleEndAndAccept = () => {
    window.dispatchEvent(new CustomEvent('end-accept-waiting-call', { detail: waitingCallSignal }));
    setWaitingCallSignal(null);
  };

  const handleBusy = () => {
    window.dispatchEvent(new CustomEvent('reject-waiting-call', { detail: { signal: waitingCallSignal, reason: 'BUSY' } }));
    setWaitingCallSignal(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-[999999] bg-background border border-border shadow-2xl rounded-2xl p-4 flex flex-col items-center min-w-[360px]"
      >
        <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse pointer-events-none" />
        
        <h3 className="text-sm font-bold text-foreground mb-1 relative z-10 flex items-center gap-2">
           <PhoneForwarded className="w-4 h-4 text-primary" />
           Call Waiting
        </h3>
        <p className="text-sm text-muted-foreground mb-4 relative z-10">
          Incoming call from <span className="font-bold text-foreground">{waitingCallSignal.callerName || 'Unknown'}</span>
        </p>

        <div className="flex items-center gap-2 w-full relative z-10">
          <button
            onClick={handleBusy}
            className="flex-1 py-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Busy
          </button>
          
          <button
            onClick={handleEndAndAccept}
            className="flex-1 py-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            End & Accept
          </button>

          <button
            onClick={handleHoldAndAccept}
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            Hold & Accept
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
