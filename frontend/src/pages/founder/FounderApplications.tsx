import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Users, Filter as FilterIcon, CheckCircle2, XCircle, Clock, Search, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { founderApplicationService } from "@/services/founderApplicationService";
import { startupService } from "@/services/myStartupService";
import type { ApplicationResponse, PageResponse } from "@/services/talentApplicationService";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";

export default function FounderApplications() {
  const [searchParams] = useSearchParams();
  const initialStartupId = searchParams.get("startupId") || "";

  const [startups, setStartups] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>(initialStartupId);
  
  const [data, setData] = useState<PageResponse<ApplicationResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    startupService.getMyStartups().then((res: any) => {
      setStartups(res);
      if (res.length > 0 && !initialStartupId) {
        setSelectedStartupId(res[0].uuid);
      } else if (initialStartupId && res.some((s: any) => s.uuid === initialStartupId)) {
        setSelectedStartupId(initialStartupId);
      } else if (res.length > 0) {
        setSelectedStartupId(res[0].uuid);
      }
    }).catch(() => toast.error("Failed to load startups"));
  }, []);

  useEffect(() => {
    if (selectedStartupId) {
      fetchApplications(selectedStartupId);
    }
  }, [selectedStartupId]);

  const fetchApplications = async (startupId: string) => {
    try {
      setLoading(true);
      const res = await founderApplicationService.getStartupApplications(startupId, 0, 100);
      setData(res);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'SHORTLISTED': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Search className="w-3 h-3 mr-1" /> Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'WITHDRAWN': return <Badge variant="secondary">Withdrawn</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApps = data?.content.filter(app => filter === 'ALL' ? true : app.status === filter) || [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white"><Users className="w-8 h-8 text-primary" /> Applications</h2>
          <p className="text-white/80 mt-2">Review and manage talent applications for your startups.</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedStartupId} onValueChange={setSelectedStartupId}>
            <SelectTrigger className="w-[200px] glass-card">
              <SelectValue placeholder="Select Startup" />
            </SelectTrigger>
            <SelectContent>
              {startups.map(s => (
                <SelectItem key={s.uuid} value={s.uuid}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStartupId && startups.find(s => s.uuid === selectedStartupId)?.status === 'PUBLISHED' && (
            <Link to={`/founder/workspace/${selectedStartupId}`} state={{ from: location.pathname }}>
              <Button variant="outline" className="hidden sm:flex border-primary/20 text-primary hover:bg-primary/10">
                Open Workspace
              </Button>
            </Link>
          )}

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] glass-card">
              <FilterIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Applications</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedStartupId ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl glass-card border-dashed">
          <Rocket className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold tracking-tight mb-2">No startup selected</h3>
          <p className="text-white/80">Please select a startup from the dropdown to view its applications.</p>
        </div>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {filteredApps.map(app => (
            <Card key={app.uuid} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {app.talentAvatarUrl ? (
                      <img src={getImageUrl(app.talentAvatarUrl)} alt={app.talentName} className="w-12 h-12 rounded-full object-cover border" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg text-primary uppercase">
                        {app.talentName.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{app.talentName}</h3>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(app.createdAt))} ago</p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-xs text-muted-foreground">Applying for</span>
                    <p className="font-medium text-sm">{app.preferredRole}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(app.skills ? app.skills.split(',') : []).slice(0, 4).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-normal">{skill.trim()}</Badge>
                      ))}
                      {(app.skills ? app.skills.split(',') : []).length > 4 && <Badge variant="secondary" className="text-[10px] font-normal">+{(app.skills ? app.skills.split(',') : []).length - 4}</Badge>}
                    </div>
                  </div>
                </div>

                <Link to={`/founder/applications/${app.uuid}`}>
                  <Button variant="outline" className="w-full">Review Application</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl glass-card border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No applications found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {filter === 'ALL' 
              ? "This startup hasn't received any applications yet." 
              : `No applications with status ${filter.toLowerCase()}.`}
          </p>
        </div>
      )}
    </div>
  );
}
