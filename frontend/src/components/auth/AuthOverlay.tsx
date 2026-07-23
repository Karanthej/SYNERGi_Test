import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Handshake } from "lucide-react";

interface AuthOverlayProps {
  isLogin: boolean;
}

export default function AuthOverlay({ isLogin }: AuthOverlayProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      
      {/* Dynamic Text */}
      <motion.div 
        className="absolute top-12 left-0 right-0 text-center px-8 z-20"
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl font-extrabold tracking-tight"
          key={isLogin ? "loginTitle" : "registerTitle"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isLogin ? "Welcome Back to SYNERGi" : "Join the Innovation Engine"}
        </motion.h1>
        <motion.p 
          className="text-muted-foreground mt-4 text-lg"
          key={isLogin ? "loginSub" : "registerSub"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLogin 
            ? "Reconnect with your team and your next big opportunity." 
            : "Connect with founders and talent to build the future."}
        </motion.p>
      </motion.div>

      {/* Mascot Composition */}
      <div className="relative w-full max-w-80 h-80 mt-16 z-10 flex items-center justify-center" style={{ perspective: '1000px' }}>
        
        {/* The Animated Illustrations Container */}
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="career-illustration"
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
                y: [0, -12, 0] 
              }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              transition={{ 
                duration: 0.5,
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-64 h-64 bg-white rounded-3xl shadow-2xl overflow-hidden border-[6px] border-white/60 flex items-center justify-center relative group">
                <img src="/career_start.png" alt="Starting Career" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 shadow-inner rounded-3xl pointer-events-none" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="team-illustration"
              initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
                y: [0, -12, 0] 
              }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              transition={{ 
                duration: 0.5,
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-full max-w-72 h-72 bg-white rounded-full shadow-2xl overflow-hidden border-[6px] border-white/60 flex items-center justify-center relative group">
                <img src="/team_build.png" alt="Building Team" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 shadow-inner rounded-full pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thematic Floating Badges */}
        <AnimatePresence>
          {isLogin && (
            <motion.div 
              className="absolute -top-2 -right-4 p-3 glass-card/90 backdrop-blur-md rounded-2xl border border-border shadow-xl z-20 flex items-center gap-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, 10, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 } }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Step Up</p>
                <p className="text-xs text-muted-foreground">Launch Career</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isLogin && (
            <motion.div 
              className="absolute -bottom-6 -left-6 p-3 glass-card/90 backdrop-blur-md rounded-2xl border border-border shadow-xl z-20 flex items-center gap-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 } }}
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Synergize</p>
                <p className="text-xs text-muted-foreground">Build Team</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}
