// @ts-nocheck
import React from 'react';
import { useCallStore } from '@/store/useCallStore';
import { X, Download, Activity, Server, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WebRTCDiagnosticsPanel() {
  const { isDiagnosticsOpen, diagnostics, setDiagnosticsOpen } = useCallStore();

  if (!isDiagnosticsOpen) return null;

  const handleExport = () => {
    if (!diagnostics) return;
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webrtc-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-24 left-6 z-[200] w-96 max-h-[80vh] overflow-y-auto glass-panel border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)] bg-background/50">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            WebRTC Diagnostics
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="p-1 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setDiagnosticsOpen(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4 text-xs font-mono">
          {!diagnostics ? (
            <div className="text-muted-foreground text-center py-8">
               Waiting for WebRTC data...
            </div>
          ) : (
            <>
               <div className="space-y-1">
                  <div className="text-muted-foreground uppercase text-[10px] tracking-wider mb-2 font-sans font-bold flex items-center gap-1">
                     <Server className="w-3 h-3" /> Connection State
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">ICE State:</span>
                     <span className={diagnostics.iceConnectionState === 'connected' ? 'text-green-500' : 'text-orange-500'}>{diagnostics.iceConnectionState}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Peer State:</span>
                     <span className={diagnostics.peerConnectionState === 'connected' ? 'text-green-500' : 'text-orange-500'}>{diagnostics.peerConnectionState}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Relay/TURN:</span>
                     <span className={diagnostics.relayUsed ? 'text-yellow-500' : 'text-blue-500'}>{diagnostics.relayUsed ? 'Active (TURN)' : 'Inactive (STUN)'}</span>
                  </div>
               </div>

               <div className="h-px w-full bg-[var(--glass-border)] my-1" />

               <div className="space-y-1">
                  <div className="text-muted-foreground uppercase text-[10px] tracking-wider mb-2 font-sans font-bold flex items-center gap-1">
                     <Radio className="w-3 h-3" /> Network Metrics
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Round Trip Time:</span>
                     <span>{diagnostics.rtt.toFixed(2)} ms</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Jitter:</span>
                     <span>{diagnostics.jitter.toFixed(2)} ms</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Packet Loss:</span>
                     <span className={diagnostics.packetLoss > 2 ? 'text-red-500' : ''}>{diagnostics.packetLoss.toFixed(2)} %</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Bitrate:</span>
                     <span>{diagnostics.bitrate} kbps</span>
                  </div>
               </div>

               <div className="h-px w-full bg-[var(--glass-border)] my-1" />

               <div className="space-y-1 pb-2">
                  <div className="text-muted-foreground uppercase text-[10px] tracking-wider mb-2 font-sans font-bold flex items-center gap-1">
                     <Activity className="w-3 h-3" /> Media & ICE
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Codec:</span>
                     <span className="truncate ml-4">{diagnostics.codec}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Audio Level:</span>
                     <span>{(diagnostics.audioLevel * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col mt-2 bg-black/20 p-2 rounded border border-white/5 overflow-hidden">
                     <span className="text-muted-foreground mb-1">Active Candidate Pair:</span>
                     <span className="text-[10px] text-green-400 break-all leading-tight">{diagnostics.selectedCandidatePair}</span>
                  </div>
               </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
