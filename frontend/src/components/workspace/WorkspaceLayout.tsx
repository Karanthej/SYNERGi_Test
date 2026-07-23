import { Outlet, useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, MessageSquare, Video, Settings, ArrowLeft, LayoutDashboard, Megaphone, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from '@/lib/utils';
import { workspaceService } from "@/services/workspaceService";
import type { WorkspaceResponse } from "@/services/workspaceService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransitionVariants } from "@/lib/animations";

export default function WorkspaceLayout() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadWorkspace = async () => {
      try {
        const workspaces = await workspaceService.getMyWorkspaces();
        const current = workspaces.find(w => w.startupUuid === id);
        if (current) {
          setWorkspace(current);
        } else {
          toast.error("Unauthorized to access this workspace.");
          navigate(user?.role === 'FOUNDER' ? '/founder/collaboration' : '/talent/collaboration', { replace: true });
        }
      } catch (err) {
        toast.error(`Failed to load workspace details: ${err instanceof Error ? err.message : String(err)}`);
        navigate(user?.role === 'FOUNDER' ? '/founder/collaboration' : '/talent/collaboration', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadWorkspace();
  }, [id, navigate, user]);

  useEffect(() => {
    const handleMinimize = () => setIsSidebarMinimized(true);
    const handleExpand = () => setIsSidebarMinimized(false);
    window.addEventListener('minimize-workspace-sidebar', handleMinimize);
    window.addEventListener('expand-workspace-sidebar', handleExpand);
    return () => {
      window.removeEventListener('minimize-workspace-sidebar', handleMinimize);
      window.removeEventListener('expand-workspace-sidebar', handleExpand);
    };
  }, []);

  if (loading) {
    return <div className="p-20 flex justify-center"><Skeleton className="h-[600px] w-full max-w-4xl rounded-2xl" /></div>;
  }

  if (!workspace) return null;

  const basePath = user?.role === 'FOUNDER' ? `/founder/workspace/${id}` : `/talent/workspace/${id}`;
  const backPath = location.state?.from || (user?.role === 'FOUNDER' ? '/founder/collaboration' : '/talent/collaboration');

  const navItems = [
    { name: "Overview", path: "", icon: LayoutDashboard },
    { name: "Members", path: "/members", icon: Users },
    { name: "Team Chat", path: "/chat", icon: MessageSquare },
    { name: "Meetings", path: "/meetings", icon: Video },
    { name: "Calls", path: "/calls", icon: Phone },
    { name: "Announcements", path: "/announcements", icon: Megaphone },
    ...(user?.role === 'FOUNDER' ? [{ name: "Settings", path: "/settings", icon: Settings }] : []),
  ];

  const isChatRoute = location.pathname.includes('/chat');

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row h-[100dvh] bg-transparent overflow-hidden pt-safe pb-safe pl-safe pr-safe">
      
      {/* Workspace Sidebar / Topbar */}
      <div className={`glass-surface flex flex-col flex-shrink-0 lg:m-6 lg:mr-2 lg:mb-6 lg:rounded-[var(--radius-xl)] border-none lg:border-solid lg:border-[var(--glass-border)] max-h-[50vh] lg:max-h-none transition-all duration-[var(--duration-smooth)] ease-[var(--ease-apple)] relative ${isSidebarMinimized ? 'lg:w-[88px]' : 'lg:w-full max-w-72'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          className="hidden lg:flex absolute -right-3.5 top-24 z-[100] w-7 h-7 glass-floating text-foreground shadow-[var(--shadow-glass-md)] rounded-full items-center justify-center hover:scale-105 transition-transform border border-[var(--glass-border)]"
        >
          {isSidebarMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex flex-col h-full overflow-hidden w-full">
          {/* Header */}
          <div className={`h-16 lg:h-24 border-b border-black/5 dark:border-white/10 flex items-center px-4 gap-3 lg:gap-4 shrink-0 ${isSidebarMinimized ? 'lg:px-0 lg:justify-center' : 'lg:px-6'}`}>
            <Link to={backPath} className="shrink-0">
              <Button variant="ghost" size="icon" className="w-8 h-8 lg:w-10 lg:h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 glass-surface shadow-sm"><ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" /></Button>
            </Link>
            <div className={`flex-1 min-w-0 ${isSidebarMinimized ? 'lg:hidden' : ''}`}>
              <h3 className="font-bold text-base lg:text-lg truncate text-foreground">{workspace.startupName}</h3>
              <p className="text-xs lg:text-sm font-medium text-primary truncate">Workspace</p>
            </div>
            {/* User context on mobile */}
            <div className="lg:hidden shrink-0 flex items-center justify-center bg-primary/20 p-1 rounded-full border border-primary/30 shadow-[0_0_10px_rgba(56,103,255,0.3)]">
              <img src={getImageUrl(user?.profileImage) || `https://ui-avatars.com/api/?name=${user?.fullName}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>

          {/* Navigation */}
          <div className="overflow-x-auto lg:overflow-y-auto overflow-y-hidden lg:overflow-x-hidden p-1 lg:p-4 mx-4 mt-2 lg:m-0 flex flex-row lg:flex-col gap-1 lg:gap-2 shrink-0 lg:flex-1 no-scrollbar bg-white/5 dark:bg-black/40 lg:bg-transparent rounded-full lg:rounded-none border border-white/10 lg:border-none shadow-inner lg:shadow-none">
            {navItems.map((item) => {
              const fullPath = `${basePath}${item.path}`;
              const isActive = item.path === "" 
                ? location.pathname === basePath 
                : location.pathname.startsWith(fullPath);
              
              return (
                <Link key={item.name} to={fullPath} className={`shrink-0 lg:w-full ${isSidebarMinimized ? 'lg:w-auto' : ''}`}>
                  <div className={`flex items-center justify-center lg:justify-start gap-2 lg:gap-4 px-4 lg:px-6 py-1.5 lg:py-3 rounded-full lg:rounded-2xl text-[13px] lg:text-[15px] font-semibold transition-all duration-300 whitespace-nowrap ${
                    isActive ? "bg-primary text-primary-foreground shadow-md lg:shadow-[var(--shadow-glow)] backdrop-blur-md lg:translate-x-1" : "text-muted-foreground hover:text-foreground lg:hover:glass lg:hover:translate-x-1"
                  } ${isSidebarMinimized ? 'lg:justify-center lg:px-0 lg:mx-2 lg:translate-x-0' : ''}`}>
                    <item.icon className={`w-3.5 h-3.5 lg:w-5 lg:h-5 shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                    <span className={`${isSidebarMinimized ? 'lg:hidden' : ''}`}>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User context (Desktop) */}
          <div className={`hidden lg:flex p-6 border-t border-black/5 dark:border-white/10 shrink-0 ${isSidebarMinimized ? 'justify-center px-0' : 'items-center gap-4'}`}>
            <img src={getImageUrl(user?.profileImage) || `https://ui-avatars.com/api/?name=${user?.fullName}`} alt="Avatar" className={`w-10 h-10 rounded-full object-cover border border-black/5 dark:border-white/10 shadow-sm shrink-0`} />
            {!isSidebarMinimized && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate text-foreground">{user?.fullName}</p>
                <p className="text-xs font-medium text-muted-foreground capitalize truncate">{workspace.userRole.replace('_', ' ').toLowerCase()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {!isChatRoute && (
          <div className="h-16 lg:h-20 glass-surface shadow-sm flex items-center justify-between px-4 lg:px-6 xl:px-8 shrink-0 m-4 lg:m-6 mt-4 lg:mt-6 mb-2 lg:mb-4 rounded-2xl z-10 border border-border">
            <h2 className="text-lg lg:text-2xl font-bold tracking-tight capitalize text-foreground truncate pr-4">
              {location.pathname.replace(basePath, '').replace('/', '') || 'Overview'}
            </h2>
            <div className="flex items-center gap-4 shrink-0">
              <Link to={user?.role === 'FOUNDER' ? `/founder/startups/${id}/edit` : `/talent/startups/${id}`}>
                <Button variant="outline" size="sm" className="hidden sm:flex border-primary/20 text-primary hover:bg-primary/10">
                  {user?.role === 'FOUNDER' ? 'Edit Startup' : 'View Public Page'}
                </Button>
              </Link>
            </div>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto ${isChatRoute ? 'm-4 lg:m-6 mt-4 lg:mt-6' : 'm-4 lg:m-6 mt-2'} mb-4 lg:mb-6 ${isChatRoute ? 'p-0' : 'p-4 lg:p-6 sm:p-8'} rounded-2xl bg-transparent relative no-scrollbar`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              <Outlet context={{ workspace }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}
