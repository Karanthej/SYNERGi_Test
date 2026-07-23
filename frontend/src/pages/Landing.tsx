import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Users, Briefcase, Zap } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";

export default function Landing() {
  const { user } = useAuthStore();
  const isSignedIn = !!user;

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-full max-w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-full max-w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />

      {/* Navbar */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center">
          <img src="/synergi-logo.png" alt="SYNERGi" className="h-10 w-auto object-contain" />
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10 mt-12 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Build Together. Grow Together.
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            The Ultimate Ecosystem for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Founders & Talent</span>
          </h1>
          
          <p className="text-white/80 max-w-2xl mx-auto leading-relaxed">
            Whether you're building the next big thing or looking to join a high-growth startup, 
            SYNERGi connects visionaries with the perfect team.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-xl" asChild>
              <Link to="/register">
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 rounded-xl" asChild>
              <Link to="/login">
                I already have an account
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full"
        >
          <div className="flex flex-col items-center text-center p-6 rounded-2xl glass-card border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
            <p className="text-white/80 text-sm">AI-driven connections between startups and top-tier talent.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-2xl glass-card border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Build Your Team</h3>
            <p className="text-white/80 text-sm">Post ideas, manage applicants, and hire the perfect fit.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl glass-card border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast Onboarding</h3>
            <p className="text-white/80 text-sm">Seamless workflow to get your profile ready in minutes.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
