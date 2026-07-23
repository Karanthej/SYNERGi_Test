import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Rocket, ShieldAlert, ArrowRight, Activity, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { workspaceService } from "@/services/workspaceService";
import type { WorkspaceResponse } from "@/services/workspaceService";
import { formatDistanceToNow, isValid } from "date-fns";
import { getImageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";

/** Safely format a lastActivity timestamp — returns a fallback string if null/invalid */
function formatActivity(value: string | null | undefined): string {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (!isValid(d)) return 'N/A';
  return formatDistanceToNow(d) + ' ago';
}

export default function CollaborationSpaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const notifications = useNotificationStore(state => state.notifications);

  const load = () => {
    setLoading(true);
    setErrorMsg(null);
    workspaceService.getMyWorkspaces()
      .then(setWorkspaces)
      .catch((err) => {
        /* console.error removed */
        setErrorMsg(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (errorMsg !== null) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-2 text-white">Could not load workspaces</h3>
        <p className="text-white/60 max-w-sm mb-4">There was a problem fetching your collaboration spaces. Please try again.</p>
        <p className="text-red-400 font-mono text-xs max-w-md mb-6 break-words">{errorMsg}</p>
        <Button onClick={load} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  const basePath = user?.role === "FOUNDER" ? "/founder" : "/talent";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white"><Building2 className="w-8 h-8 text-primary" /> Collaboration Spaces</h2>
        <p className="text-white/80 mt-2">
          {user?.role === "FOUNDER" 
            ? "Manage the private workspaces for your startups." 
            : "Access your secure startup team workspaces."}
        </p>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl glass-card border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No active workspaces</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {user?.role === "FOUNDER" 
              ? "You haven't created any startups yet, or you don't have active team members."
              : "You haven't been accepted into any startups yet."}
          </p>
          <Button onClick={() => navigate(user?.role === "FOUNDER" ? "/founder/startups/create" : "/talent/startups")} className="w-full sm:w-auto">
            {user?.role === "FOUNDER" ? "Create Startup" : "Browse"}
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map(ws => (
            <div
              key={ws.startupUuid}
              className="group relative rounded-[28px] overflow-hidden glass-card transition-all duration-[var(--duration-smooth)] ease-[var(--ease-apple)] flex flex-col"
            >
              {/* Unread Badge */}
              {notifications.filter(n => !n.isRead && n.workspaceUuid === ws.startupUuid).length > 0 && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full border-[4px] border-[#0A0A0B] flex items-center justify-center text-xs font-bold text-white shadow-xl z-20 animate-in zoom-in duration-300">
                  {notifications.filter(n => !n.isRead && n.workspaceUuid === ws.startupUuid).length}
                </div>
              )}
              
              {/* Starry top accent line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Inner ambient glow */}
              <div className="absolute -inset-px bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[28px] pointer-events-none" />

              <div className="p-6 flex-1 flex flex-col relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3.5">
                    {/* Logo container with gradient border */}
                    <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 group-hover:from-primary/40 group-hover:to-accent/40 transition-all duration-500 shadow-inner">
                      {ws.startupLogoUrl ? (
                        <img src={getImageUrl(ws.startupLogoUrl)} alt={ws.startupName} className="w-12 h-12 rounded-[14px] object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-[14px] bg-primary/20 flex items-center justify-center font-bold text-lg text-primary-foreground uppercase border border-white/5">
                          {ws.startupName.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white leading-tight group-hover:text-primary transition-colors duration-300">
                        {ws.startupName}
                      </h3>
                      <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                        {ws.stage || 'Startup'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mb-6 min-h-[40px]">
                  {ws.tagline || 'No tagline provided.'}
                </p>

                {/* Info List */}
                <div className="space-y-3.5 mb-6 flex-1 border-t border-b border-white/5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary/70 group-hover:scale-110 transition-transform duration-300" />
                      Team Size
                    </span>
                    <span className="font-semibold text-white">
                      {ws.teamMemberCount} {ws.teamMemberCount === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-accent/70 group-hover:scale-110 transition-transform duration-300" />
                      Role
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                      ws.userRole === 'OWNER' 
                        ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {ws.userRole.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-400/60 group-hover:scale-110 transition-transform duration-300" />
                      Last Activity
                    </span>
                    <span className="font-semibold text-xs text-slate-300">
                      {formatActivity(ws.lastActivity as unknown as string)}
                    </span>
                  </div>
                </div>

                {/* Link Action */}
                <Link to={`${basePath}/workspace/${ws.startupUuid}`} className="w-full mt-auto">
                  <Button className="w-full h-11 rounded-xl bg-primary/25 hover:bg-primary border border-primary/30 hover:border-transparent text-primary hover:text-primary-foreground font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    Open Workspace 
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
