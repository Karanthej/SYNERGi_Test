// @ts-nocheck
import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { 
  LayoutDashboard, Rocket, Briefcase, Users, Settings, 
  Menu, LogOut, ChevronLeft, ChevronRight, User as UserIcon, Search, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getImageUrl } from "@/lib/utils";
import { pageTransitionVariants } from "@/lib/animations";
// import GlobalChatBubble from "@/components/chat/GlobalChatBubble";
import MobileBottomNav from "./MobileBottomNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalCommandPalette } from "@/components/search/GlobalCommandPalette";
import { useSearchStore } from "@/store/useSearchStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { user, logout } = useAuthStore();
  const { personalInfo } = useOnboardingStore();
  const location = useLocation();

  const isFounder = user?.role === 'FOUNDER';

  const founderLinks = [
    { name: "Dashboard", href: "/founder/dashboard", icon: LayoutDashboard },
    { name: "My Startups", href: "/founder/startups", icon: Building2 },
    { name: "Browse", href: "/founder/browse", icon: Search },
    { name: "Job Offered", href: "/founder/job-offers", icon: Briefcase },
    { name: "Applications", href: "/founder/applications", icon: Briefcase },
    { name: "Collaboration", href: "/founder/collaboration", icon: Users },
    { name: "Profile", href: "/founder/profile", icon: UserIcon },
    { name: "Settings", href: "/founder/settings", icon: Settings },
  ];

  const talentLinks = [
    { name: "Dashboard", href: "/talent/dashboard", icon: LayoutDashboard },
    { name: "Browse", href: "/talent/browse", icon: Search },
    { name: "Job Offers", href: "/talent/job-offers", icon: Briefcase },
    { name: "My Applications", href: "/talent/applications", icon: Briefcase },
    { name: "Collaboration", href: "/talent/collaboration", icon: Users },
    { name: "Profile", href: "/talent/profile", icon: UserIcon },
    { name: "Settings", href: "/talent/settings", icon: Settings },
  ];

  const navLinks = isFounder ? founderLinks : talentLinks;
  const currentTitle = navLinks.find(link => location.pathname === link.href)?.name || "Dashboard";

  return (
    <div className="min-h-[100dvh] flex bg-transparent pt-safe pb-safe pl-safe pr-safe">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col glass-surface shadow-sm transition-all duration-[var(--duration-slow)] ease-[var(--ease-apple)] relative z-20 m-6 mr-2 mb-6 border border-border rounded-2xl",
        isCollapsed ? "w-24" : "w-full max-w-72"
      )}>
        <div className="h-24 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/10">
          {!isCollapsed && <img src="/synergi-logo.png" alt="SYNERGi" className="h-14 w-auto object-contain py-1.5 -ml-1" />}
          {isCollapsed && <img src="/synergi-icon.png" alt="S" className="h-10 w-10 mx-auto rounded-xl object-contain" />}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-4 top-8 z-[100] h-8 w-8 rounded-full border border-[var(--glass-border)] glass-floating shadow-sm"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-[var(--duration-smooth)] ease-[var(--ease-apple)]",
                  isActive ? "bg-gradient-to-b from-primary/90 to-primary text-white font-semibold shadow-[0_4px_12px_rgba(56,103,255,0.25)] translate-x-1" : "text-muted-foreground hover:bg-primary/5 dark:hover:bg-white/10 hover:text-foreground hover:translate-x-1",
                  isCollapsed ? "justify-center" : ""
                )}
                title={isCollapsed ? link.name : undefined}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                {!isCollapsed && <span className="text-[15px]">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-black/5 dark:border-white/10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn("w-full h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-all", isCollapsed ? "justify-center px-0" : "justify-start")}
              >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end your current session and return you to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => logout()} className="bg-gradient-to-b from-red-500 to-rose-600 text-white shadow-md hover:brightness-110">
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-[280px] sm:w-full max-w-72 glass-surface shadow-lg z-50 flex flex-col lg:hidden m-2 sm:m-4 rounded-2xl border border-border"
          >
            <div className="h-16 flex items-center px-6 border-b border-black/5 dark:border-white/10">
              <img src="/synergi-logo.png" alt="SYNERGi" className="h-14 w-auto object-contain py-1.5 -ml-1" />
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all",
                      isActive ? "bg-gradient-to-b from-primary/90 to-primary text-white font-semibold shadow-[0_4px_12px_rgba(56,103,255,0.25)]" : "text-muted-foreground hover:bg-primary/5 dark:hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-black/5 dark:border-white/10">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-2xl justify-start text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end your current session and return you to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => logout()} className="bg-gradient-to-b from-red-500 to-rose-600 text-white shadow-md hover:brightness-110">
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 md:h-20 glass-surface shadow-sm flex items-center justify-between px-4 lg:px-8 z-10 m-2 md:m-6 mt-4 md:mt-6 mb-2 md:mb-4 rounded-2xl border border-border shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold hidden sm:block tracking-tight text-foreground">{currentTitle}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => useSearchStore.getState().setIsOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground mr-2 group"
            >
              <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium mr-4">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/5 dark:bg-white/10">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <NotificationBell />
            <Link to={isFounder ? '/founder/profile' : '/talent/profile'} className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold leading-none text-foreground">{personalInfo?.fullName || user?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{isFounder ? 'Founder' : 'Talent'}</p>
              </div>
              <Avatar className="h-11 w-11 border-2 border-black/5 dark:border-white/10 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                <AvatarImage src={getImageUrl(user?.profileImage)} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {(personalInfo?.fullName || user?.fullName || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative m-2 md:m-6 mt-0 md:mt-2 mb-2 md:mb-6 rounded-2xl bg-transparent p-4 sm:p-6 md:p-8 no-scrollbar pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <GlobalCommandPalette />
      <MobileBottomNav />
    </div>
  );
}

