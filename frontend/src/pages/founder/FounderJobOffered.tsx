import { useState, useEffect } from "react";
import type { JobOffer } from "@/types/jobOffer";
import { jobOfferService } from "@/services/jobOfferService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Building2, User as UserIcon, Calendar, ArrowRight, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { HireTalentDialog } from "@/components/founder/HireTalentDialog";

export default function FounderJobOffered() {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [hireDialog, setHireDialog] = useState<{isOpen: boolean, uuid: string, name: string}>({
    isOpen: false,
    uuid: "",
    name: ""
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await jobOfferService.getFounderJobOffers();
      setOffers(data);
    } catch (error) {
      toast.error("Failed to fetch sent job offers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    try {
      setProcessingId(uuid);
      await jobOfferService.deleteJobOffer(uuid);
      toast.success("Job offer record deleted");
      setOffers(prev => prev.filter(o => o.uuid !== uuid));
    } catch (error) {
      toast.error("Failed to delete job offer");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case 'APPLIED':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Applied</Badge>;
      case 'ACCEPTED':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Hired</Badge>;
      case 'APPLICATION_REJECTED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">App Rejected</Badge>;
      case 'APPLICATION_WITHDRAWN':
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">Withdrawn</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Job Offered</h1>
        <p className="text-muted-foreground">Track invitations you've sent to talents.</p>
      </div>

      {offers.length === 0 ? (
        <Card className="glass-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <UserIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Offers Sent</h3>
            <p className="text-muted-foreground max-w-md">
              Browse talents and invite them to your startup using the Hire button on their profile.
            </p>
            <Button className="mt-6" onClick={() => navigate('/founder/browse')}>
              Browse Talents
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <Card key={offer.uuid} className="glass-card flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden shrink-0">
                    <img 
                      src={getImageUrl(offer.talent?.user?.profileImage) || "/placeholder.svg"} 
                      alt="Talent" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${offer.talent?.user?.fullName}&background=random`; }}
                    />
                  </div>
                  {getStatusBadge(offer.status)}
                </div>
                <CardTitle className="text-xl">{offer.talent?.user?.fullName}</CardTitle>
                <CardDescription className="text-sm">
                  @{offer.talent?.user?.username}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Invited to <span className="font-medium text-foreground">{offer.startup?.name}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Sent on {format(new Date(offer.createdAt), "MMM d, yyyy")}</span>
                </div>
                
                <Link to={`/founder/profile/${offer.talent?.user?.uuid}`} className="text-sm text-primary hover:underline block mt-4">
                  View talent profile &rarr;
                </Link>
              </CardContent>
              <CardFooter className="flex gap-3 pt-4 border-t border-border/50">
                {(offer.status === 'REJECTED' || offer.status === 'APPLICATION_REJECTED' || offer.status === 'APPLICATION_WITHDRAWN') && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(offer.uuid)}
                      disabled={processingId === offer.uuid}
                    >
                      {processingId === offer.uuid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Delete
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setHireDialog({ isOpen: true, uuid: offer.talent?.user?.uuid, name: offer.talent?.user?.fullName })}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Hire Again
                    </Button>
                  </>
                )}

                {offer.status === 'APPLIED' && (
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 shadow-sm"
                    onClick={() => navigate('/founder/applications')}
                  >
                    Review Application <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {offer.status === 'ACCEPTED' && (
                  <Button 
                    variant="outline"
                    className="w-full border-green-200 text-green-700 bg-green-50"
                    disabled
                  >
                    Successfully Hired!
                  </Button>
                )}

                {offer.status === 'PENDING' && (
                  <Button 
                    variant="secondary"
                    className="w-full"
                    disabled
                  >
                    Waiting for response...
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {hireDialog.isOpen && (
        <HireTalentDialog
          isOpen={hireDialog.isOpen}
          onClose={() => {
            setHireDialog({ isOpen: false, uuid: "", name: "" });
            fetchOffers(); // Refresh offers after closing
          }}
          talentUuid={hireDialog.uuid}
          talentName={hireDialog.name}
        />
      )}
    </div>
  );
}
