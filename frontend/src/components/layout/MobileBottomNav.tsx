import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Home, Grid, Briefcase, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isFounder = user?.role === 'FOUNDER';

  const founderLinks = [
    { name: "Home", href: "/founder/dashboard", icon: Home },
    { name: "Workspaces", href: "/founder/startups", icon: Grid },
    { name: "Applications", href: "/founder/applications", icon: Briefcase },
    { name: "Discover", href: "/founder/browse", icon: Search },
    { name: "Profile", href: "/founder/profile", icon: User },
  ];

  const talentLinks = [
    { name: "Home", href: "/talent/dashboard", icon: Home },
    { name: "Workspaces", href: "/talent/collaboration", icon: Grid },
    { name: "Applications", href: "/talent/applications", icon: Briefcase },
    { name: "Discover", href: "/talent/startups", icon: Search },
    { name: "Profile", href: "/talent/profile", icon: User },
  ];

  const links = isFounder ? founderLinks : talentLinks;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe">
      <div className="glass-surface border-t border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl flex items-center justify-between px-2 h-[72px]">
        {links.map((link) => {
          const Icon = link.icon;
          // Simple active check. Can be more robust if needed.
          const isActive = location.pathname.includes(link.href) || 
                           (link.name === 'Profile' && location.pathname.includes('settings'));
                           
          return (
            <Link
              key={link.name}
              to={link.href}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 relative group"
            >
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-300 flex items-center justify-center",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                <Icon className={cn("w-5 h-5 transition-all duration-300", isActive && "scale-110")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {link.name}
              </span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -top-3 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(56,103,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
