import { useOutletContext, useLocation } from "react-router-dom";
import { MessageSquare, Video, Folder, CheckSquare, Megaphone, Calendar, Settings, LayoutDashboard, Construction } from "lucide-react";
import type { WorkspaceResponse } from "@/services/workspaceService";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkspacePlaceholder() {
  const { workspace } = useOutletContext<{ workspace: WorkspaceResponse }>();
  const location = useLocation();

  const getPlaceholderInfo = () => {
    if (location.pathname.endsWith('chat')) return { icon: MessageSquare, title: "Team Chat", desc: "Real-time communication channels for your team." };
    if (location.pathname.endsWith('meetings')) return { icon: Video, title: "Video Meetings", desc: "Host secure video and voice calls natively." };
    if (location.pathname.endsWith('files')) return { icon: Folder, title: "Shared Files", desc: "Securely store and share project documents." };
    if (location.pathname.endsWith('tasks')) return { icon: CheckSquare, title: "Task Management", desc: "Track progress and assign issues." };
    if (location.pathname.endsWith('announcements')) return { icon: Megaphone, title: "Announcements", desc: "Broadcast important updates to the team." };
    if (location.pathname.endsWith('calendar')) return { icon: Calendar, title: "Shared Calendar", desc: "Schedule events and set team milestones." };
    if (location.pathname.endsWith('settings')) return { icon: Settings, title: "Workspace Settings", desc: "Configure permissions and integrations." };
    
    return { icon: LayoutDashboard, title: "Workspace Overview", desc: "A dashboard summarizing all workspace activity." };
  };

  const { icon: Icon, title, desc } = getPlaceholderInfo();

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6">
      
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative z-10">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 bg-transparent rounded-full p-1 shadow-md z-20">
          <Construction className="w-6 h-6 text-yellow-500" />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-3 text-white">{title}</h2>
        <p className="text-white/80 text-lg mb-8">{desc}</p>
      </div>

      <Card className="w-full glass-card/50 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 text-left">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="font-bold text-muted-foreground">V2</span>
            </div>
            <div>
              <p className="font-medium">Coming Soon in Phase 6+</p>
              <p className="text-sm text-muted-foreground">This feature is currently under active development. You are securely connected to the <strong className="text-foreground">{workspace.startupName}</strong> workspace.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
