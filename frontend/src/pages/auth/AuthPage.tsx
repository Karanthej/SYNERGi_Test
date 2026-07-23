// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@clerk/clerk-react";

export default function AuthPage() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { isLoaded, userId, signOut } = useAuth();

  // Determine initial state based on route
  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");

  useEffect(() => {
    setIsLogin(location.pathname !== "/register");
  }, [location.pathname]);

  // If Clerk says we are logged in, we should go to dashboard.
  // ProtectedRoute will handle fetching the backend user if it's missing.
  useEffect(() => {
    if (!isLoaded) return;
    
    if (user && !userId) {
      // Clerk session expired, but local storage still has user profile
      useAuthStore.getState().logout();
    }
  }, [isLoaded, user, userId]);

  if (!isLoaded) {
    return null; // Wait for Clerk to load
  }

  if (user && userId) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSwitchMode = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    // Update URL seamlessly without reloading
    window.history.pushState(null, "", newIsLogin ? "/login" : "/register");
  };

  return (
    <div className="min-h-[100dvh] bg-transparent relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background is handled by GlobalBackgroundEngine */}

      {/* Centered Logo Header */}
      <Link to="/" className="mb-8 z-50">
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          src="/synergi-icon.png" 
          alt="Synergi Logo" 
          className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-xl" 
        />
      </Link>

      {/* Main Centered Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="w-full max-w-md relative z-10 glass-card rounded-3xl shadow-2xl border border-border/50 backdrop-blur-xl overflow-hidden p-6 md:p-10"
      >
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div 
              key="login" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <LoginForm onSwitchMode={handleSwitchMode} />
            </motion.div>
          ) : (
            <motion.div 
              key="register" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <RegisterForm onSwitchMode={handleSwitchMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 text-center text-xs text-muted-foreground z-10 relative"
      >
        &copy; {new Date().getFullYear()} SYNERGi. All rights reserved.
      </motion.div>
    </div>
  );
}
