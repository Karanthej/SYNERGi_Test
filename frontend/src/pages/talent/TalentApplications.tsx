import { Briefcase, Clock, CheckCircle2, XCircle, Search, Rocket } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { talentApplicationService } from "@/services/talentApplicationService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link } from "react-router-dom";
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
import { formatDistanceToNow } from "date-fns";

export default function TalentApplications() {
  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['talent-applications'],
    queryFn: () => talentApplicationService.getMyApplications(0, 50)
  });

  const withdrawMutation = useMutation({
    mutationFn: (appUuid: string) => talentApplicationService.withdraw(appUuid),
    onSuccess: () => {
      toast.success("Application withdrawn");
      queryClient.invalidateQueries({ queryKey: ['talent-applications'] });
    },
    onError: () => {
      toast.error("Failed to withdraw application");
    }
  });

  const handleWithdraw = (appUuid: string) => {
    withdrawMutation.mutate(appUuid);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case 'SHORTLISTED': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Search className="w-3 h-3 mr-1" /> Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'WITHDRAWN': return <Badge variant="secondary">Withdrawn</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white"><Briefcase className="w-8 h-8 text-primary" /> My Applications</h2>
        <p className="text-white/80 mt-2">Track the status of your startup applications.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : data?.content.length ? (
        <div className="space-y-4">
          {data.content.map(app => (
            <Card key={app.uuid} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {app.startupLogoUrl ? (
                        <img src={app.startupLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Rocket className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">{app.startupName}</h3>
                      <p className="text-sm text-muted-foreground">Applied for: <span className="font-medium text-foreground">{app.preferredRole}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Applied {formatDistanceToNow(new Date(app.createdAt))} ago</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(app.status)}
                    <div className="flex gap-2">
                      <Link to={`/talent/startups/${app.startupUuid}`}>
                        <Button variant="outline" size="sm">View Startup</Button>
                      </Link>

                      {app.status === 'ACCEPTED' && (
                        <Link to={`/talent/workspace/${app.startupUuid}`}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            Open Workspace
                          </Button>
                        </Link>
                      )}
                      
                      {app.status === 'PENDING' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Withdraw</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will withdraw your application from {app.startupName}. You cannot undo this action.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleWithdraw(app.uuid)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Withdraw Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl glass-card border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">No applications yet</h3>
          <p className="text-white/80 max-w-md mx-auto mb-8">You haven't applied to any startups. Discover exciting ideas and send your first application!</p>
          <Link to="/talent/startups">
            <Button>Discover Startups</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
