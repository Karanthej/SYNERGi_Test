import { useState, useEffect } from "react";
import type { JobOffer } from "@/types/jobOffer";
import { jobOfferService } from "@/services/jobOfferService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, User as UserIcon, Calendar, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/utils";
import { format } from "date-fns";

export default function TalentJobOffers() {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await jobOfferService.getTalentJobOffers();
      setOffers(data);
    } catch (error) {
      toast.error("Failed to fetch job offers");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (uuid: string) => {
    try {
      setProcessingId(uuid);
      await jobOfferService.rejectJobOffer(uuid);
      toast.success("Job offer rejected");
      setOffers(prev => prev.filter(o => o.uuid !== uuid));
    } catch (error) {
      toast.error("Failed to reject job offer");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApply = (startupUuid: string, offerUuid: string) => {
    navigate(`/talent/startups/${startupUuid}/apply?offer=${offerUuid}`);
  };

  // Only show PENDING offers for Talent, since rejected disappear, applied become normal applications
  const activeOffers = offers.filter(o => o.status === 'PENDING');

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
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Job Offers</h1>
        <p className="text-muted-foreground">Invitations from founders to join their startups.</p>
      </div>

      {activeOffers.length === 0 ? (
        <Card className="glass-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Offers</h3>
            <p className="text-muted-foreground max-w-md">
              When a founder thinks you'd be a great fit for their startup, their invitation will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOffers.map(offer => (
            <Card key={offer.uuid} className="glass-card flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {offer.startup?.logoUrl ? (
                      <img src={getImageUrl(offer.startup.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                    Pending
                  </Badge>
                </div>
                <CardTitle className="text-xl">{offer.startup?.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {offer.startup?.tagline || offer.startup?.pitch || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Invited by <span className="font-medium text-foreground">{offer.founder?.user?.fullName}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Sent on {format(new Date(offer.createdAt), "MMM d, yyyy")}</span>
                </div>
                
                <Link to={`/talent/startups/${offer.startup?.uuid}`} className="text-sm text-primary hover:underline block mt-4">
                  View full startup profile &rarr;
                </Link>
              </CardContent>
              <CardFooter className="flex gap-3 pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleReject(offer.uuid)}
                  disabled={processingId === offer.uuid}
                >
                  {processingId === offer.uuid ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 shadow-sm"
                  onClick={() => handleApply(offer.startup.uuid, offer.uuid)}
                  disabled={processingId === offer.uuid}
                >
                  {processingId === offer.uuid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Apply
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
