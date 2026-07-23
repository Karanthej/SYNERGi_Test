import { memo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, Users, FileText, CalendarDays, 
  CheckCircle2, Clock, ArchiveRestore, Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "@/lib/utils";

export interface StartupResponse {
  uuid: string;
  name: string;
  logoUrl?: string;
  coverUrl?: string;
  tagline?: string;
  pitch?: string;
  problemStatement?: string;
  solution?: string;
  vision?: string;
  mission?: string;
  detailedDescription?: string;
  targetAudience?: string;
  businessModel?: string;
  revenueModel?: string;
  currentProgress?: string;
  roadmap?: string;
  futureGoals?: string;
  industry?: string;
  stage?: string;
  teamSize?: string;
  expectedTeamSize?: string;
  timeline?: string;
  launchGoal?: string;
  commitmentType?: string;
  workType?: string;
  city?: string;
  equityAvailable?: string;
  equityPercentage?: string;
  roles?: string[];
  skills?: string[];
  attachments?: any[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  views: number;
  applicationsCount: number;
  teamMembersCount: number;
  maxMembers?: number;
  approvedMembers?: number;
  availableSlots?: number;
  applicationsOpen?: boolean;
}

interface StartupCardProps {
  startup: StartupResponse;
  onDelete: (uuid: string) => void;
  onArchive: (uuid: string) => void;
  onPublish: (uuid: string) => void;
}

export const StartupCard = memo(function StartupCard({ startup, onDelete, onArchive, onPublish }: StartupCardProps) {
  
  const statusColors = {
    DRAFT: "bg-muted text-muted-foreground",
    PUBLISHED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    ARCHIVED: "bg-orange-500/10 text-orange-600 border-orange-500/20"
  };

  const StatusIcon = {
    DRAFT: Clock,
    PUBLISHED: CheckCircle2,
    ARCHIVED: ArchiveRestore
  }[startup.status];

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col h-full border">
      {/* Cover Image & Dropdown */}
      <div className="relative h-32 bg-muted w-full overflow-hidden shrink-0">
        {startup.coverUrl ? (
          <img src={getImageUrl(startup.coverUrl)} alt="Cover" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
        )}
        
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-transparent backdrop-blur shadow-sm hover:bg-transparent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/founder/startups/${startup.uuid}/edit`}>Edit Details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/founder/applications?startupId=${startup.uuid}`}>View Applications</Link>
              </DropdownMenuItem>
              {startup.status === 'PUBLISHED' && (
                <DropdownMenuItem asChild>
                  <Link to={`/founder/workspace/${startup.uuid}`}>Open Workspace</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {startup.status !== 'PUBLISHED' && (
                <DropdownMenuItem onClick={() => onPublish(startup.uuid)}>Publish</DropdownMenuItem>
              )}
              {startup.status !== 'ARCHIVED' && (
                <DropdownMenuItem onClick={() => onArchive(startup.uuid)}>Archive</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(startup.uuid)} className="text-destructive focus:bg-destructive/10">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="pt-0 flex-1 flex flex-col relative z-0">
        {/* Logo */}
        <div className="absolute -top-10 left-6 h-20 w-20 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center shrink-0 z-20 shadow-md">
          {startup.logoUrl ? (
            <img src={getImageUrl(startup.logoUrl)} alt="Logo" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <Globe className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="mt-14">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-lg line-clamp-1" title={startup.name}>{startup.name}</h3>
            <Badge variant="outline" className={statusColors[startup.status]}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {startup.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {startup.tagline || "No tagline provided."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 shrink-0">
          {startup.stage && <Badge variant="secondary" className="font-normal text-xs">{startup.stage.replace('_', ' ')}</Badge>}
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 w-full">
            <CalendarDays className="h-3 w-3" />
            Updated {formatDistanceToNow(new Date(startup.updatedAt), { addSuffix: true })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/10 grid grid-cols-2 divide-x py-3 px-0 shrink-0">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-sm font-semibold">{startup.applicationsCount}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center"><FileText className="w-3 h-3 mr-1"/> Apps</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-sm font-semibold">
            {startup.teamMembersCount} {startup.maxMembers ? `/ ${startup.maxMembers}` : ''}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center"><Users className="w-3 h-3 mr-1"/> Team</span>
        </div>
      </CardFooter>
    </Card>
  );
});
