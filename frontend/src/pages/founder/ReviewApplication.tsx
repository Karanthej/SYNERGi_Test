import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { founderApplicationService } from "@/services/founderApplicationService";
import type { ApplicationResponse } from "@/services/talentApplicationService";
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, Search, ExternalLink, 
  User, Briefcase, FileText, Code2, Link as LinkIcon, Calendar, Globe, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "@/lib/utils";

export default function ReviewApplication() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      founderApplicationService.getApplicationDetails(id)
        .then(setApp)
        .catch(() => toast.error("Failed to load application details"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    if (!app) return;
    setUpdating(true);
    try {
      await founderApplicationService.updateApplicationStatus(app.uuid, status);
      setApp({ ...app, status });
      toast.success(`Application marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-base py-1 px-4"><Clock className="w-4 h-4 mr-2" /> Pending Review</Badge>;
      case 'SHORTLISTED': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-base py-1 px-4"><Search className="w-4 h-4 mr-2" /> Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-base py-1 px-4"><CheckCircle2 className="w-4 h-4 mr-2" /> Accepted</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-base py-1 px-4"><XCircle className="w-4 h-4 mr-2" /> Rejected</Badge>;
      case 'WITHDRAWN': return <Badge variant="secondary" className="text-base py-1 px-4">Withdrawn by Talent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Skeleton className="h-[400px] sm:h-[600px] w-full max-w-4xl rounded-2xl" /></div>;
  if (!app) return <Navigate to="/404" replace />;

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-8 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/founder/applications">
            <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Review Application</h1>
            <p className="text-white/80 text-sm">For {app.startupName} • Applied {formatDistanceToNow(new Date(app.createdAt))} ago</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {app.status === 'ACCEPTED' && (
            <Link to={`/founder/workspace/${app.startupUuid}`} state={{ from: location.pathname }}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:scale-105 transition-all hidden md:flex">
                Open Workspace
              </Button>
            </Link>
          )}
          {getStatusBadge(app.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Pitch</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Introduction</h4>
                <p className="text-foreground whitespace-pre-wrap">{app.introduction}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why join this startup?</h4>
                <p className="text-foreground whitespace-pre-wrap">{app.whyJoin}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why they are the right fit</h4>
                <p className="text-foreground whitespace-pre-wrap border-l-4 border-primary/50 pl-4 py-1 italic">{app.whyRightFit}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Professional Details</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Applying for Role</p>
                <p className="font-medium text-lg">{app.preferredRole}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Occupation</p>
                <p className="font-medium">{app.currentOccupation || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium">{app.yearsExperience || "Not specified"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Core Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(app.skills ? app.skills.split(',') : []).map((s, i) => <Badge key={i} variant="secondary">{s.trim()}</Badge>)}
                </div>
              </div>
              {app.technologiesKnown && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Technologies</p>
                  <p className="text-sm">{app.technologiesKnown}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {(app.previousStartupExperience || app.openSourceContributions || app.achievements || app.additionalNotes) && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Additional Background</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {app.previousStartupExperience && <div><p className="text-sm text-muted-foreground mb-1">Previous Startup Experience</p><p className="text-sm">{app.previousStartupExperience}</p></div>}
                {app.openSourceContributions && <div><p className="text-sm text-muted-foreground mb-1">Open Source Contributions</p><p className="text-sm">{app.openSourceContributions}</p></div>}
                {app.achievements && <div><p className="text-sm text-muted-foreground mb-1">Achievements</p><p className="text-sm">{app.achievements}</p></div>}
                {app.additionalNotes && <div><p className="text-sm text-muted-foreground mb-1">Additional Notes</p><p className="text-sm">{app.additionalNotes}</p></div>}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          <Card className="border-primary/20 shadow-md">
            <CardContent className="pt-6 text-center">
              <Link to={`/founder/profile/${app.talentUuid}`} className="block hover:opacity-80 transition-opacity">
                {app.talentAvatarUrl ? (
                  <img src={getImageUrl(app.talentAvatarUrl)} alt={app.talentName} className="h-24 w-24 rounded-full object-cover mx-auto mb-4 shadow-md border" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center font-bold text-3xl text-primary mx-auto mb-4 uppercase border">
                    {app.talentName.substring(0, 2)}
                  </div>
                )}
                <h2 className="text-xl font-bold hover:underline">{app.talentName}</h2>
              </Link>
              <p className="text-white/80 text-sm mt-1">{app.talentEmail}</p>
              
              <Link to={`/founder/workspace/${app.startupUuid}/chat`} state={{ openPrivateChatWithUserUuid: app.talentUuid, from: location.pathname }}>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Message Talent
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Portfolio & Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {app.resumeUrl ? (
                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 hover:bg-primary/10 transition-colors text-primary font-medium">
                  <FileText className="w-5 h-5" /> View Resume <ExternalLink className="w-4 h-4 ml-auto" />
                </a>
              ) : <p className="text-sm text-muted-foreground">No resume provided.</p>}
              
              {app.linkedinUrl && (
                <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-sm">
                  <User className="w-4 h-4" /> LinkedIn <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </a>
              )}
              {app.githubUrl && (
                <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-sm">
                  <Code2 className="w-4 h-4" /> GitHub <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </a>
              )}
              {app.portfolioUrl && (
                <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-sm">
                  <Globe className="w-4 h-4" /> Portfolio <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </a>
              )}
              {app.personalWebsiteUrl && (
                <a href={app.personalWebsiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-sm">
                  <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" /> Availability</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-xs text-muted-foreground">Hours per Week</p><p className="font-medium text-sm">{app.hoursAvailable || "Not specified"}</p></div>
              <div><p className="text-xs text-muted-foreground">Working Style</p><p className="font-medium text-sm">{app.preferredWorkingStyle || "Not specified"}</p></div>
              <div><p className="text-xs text-muted-foreground">Start Date</p><p className="font-medium text-sm">{app.availableStartDate || "Not specified"}</p></div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Floating Action Bar */}
      {app.status !== 'WITHDRAWN' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent backdrop-blur-md border-t flex justify-center z-50">
          <div className="max-w-4xl w-full flex items-center justify-between gap-4">
            <p className="hidden sm:block text-sm font-medium">Update Application Status</p>
            <div className="flex gap-3 w-full sm:w-auto">
              {app.status !== 'REJECTED' && (
                <Button variant="outline" className="flex-1 sm:w-32 border-destructive text-destructive hover:bg-destructive/10" disabled={updating} onClick={() => handleUpdateStatus('REJECTED')}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              )}
              
              {app.status === 'PENDING' && (
                <Button variant="outline" className="flex-1 sm:w-32 border-blue-500 text-blue-500 hover:bg-blue-500/10" disabled={updating} onClick={() => handleUpdateStatus('SHORTLISTED')}>
                  <Search className="w-4 h-4 mr-2" /> Shortlist
                </Button>
              )}
              
              {app.status !== 'ACCEPTED' && (
                <Button className="flex-1 sm:w-32 bg-emerald-600 hover:bg-emerald-700" disabled={updating} onClick={() => handleUpdateStatus('ACCEPTED')}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                </Button>
              )}
              {app.status === 'ACCEPTED' && (
                <Link to={`/founder/workspace/${app.startupUuid}`} state={{ from: location.pathname }} className="flex-1 sm:w-auto">
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:scale-105 transition-all">
                    Go to Workspace
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
