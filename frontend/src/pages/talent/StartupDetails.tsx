import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImageUrl } from "@/lib/utils";
import { talentStartupService } from "@/services/talentStartupService";
import type { ExploreStartupResponse } from "@/services/talentStartupService";
import { 
  ArrowLeft, Bookmark, Share2, MapPin, Users, Target, Rocket,
  CalendarDays, Lightbulb, TrendingUp, CheckCircle2, Globe, FileText, Briefcase, Clock
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { talentApplicationService } from "@/services/talentApplicationService";
import { jobOfferService } from "@/services/jobOfferService";

export default function StartupDetails() {
  const { id } = useParams<{ id: string }>();
  const [startup, setStartup] = useState<ExploreStartupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  
  // Application & Offer State
  const [appStatus, setAppStatus] = useState<any>(null);
  const [pendingOffer, setPendingOffer] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        talentStartupService.getStartupDetails(id),
        talentApplicationService.getApplicationStatus(id),
        jobOfferService.getTalentJobOffers().catch(() => []) // Catching to avoid breaking page if it fails
      ])
      .then(([startupData, appData, offersData]) => {
        setStartup(startupData);
        setIsBookmarked(startupData.isBookmarkedByMe);
        setAppStatus(appData);
        
        const offer = (offersData as any[]).find(o => o.startup.uuid === id && o.status === 'PENDING');
        setPendingOffer(offer || null);
      })
      .catch(() => {
        toast.error("Failed to load startup details");
      })
      .finally(() => setLoading(false));
    }
  }, [id]);

  const handleBookmark = async () => {
    if (!startup || bookmarking) return;
    setBookmarking(true);
    try {
      if (isBookmarked) {
        await talentStartupService.unbookmarkStartup(startup.uuid);
        setIsBookmarked(false);
        toast.success("Removed from bookmarks");
      } else {
        await talentStartupService.bookmarkStartup(startup.uuid);
        setIsBookmarked(true);
        toast.success("Startup bookmarked!");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (!startup) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: startup.name,
          text: startup.tagline || `Check out ${startup.name} on SYNERGi`,
          url: url
        });
      } catch (err) {
        /* console.error removed */
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };
  const handleWithdraw = async () => {
    if (!appStatus) return;
    setWithdrawing(true);
    try {
      await talentApplicationService.withdraw(appStatus.uuid);
      setAppStatus({ ...appStatus, status: 'WITHDRAWN' });
      toast.success("Application withdrawn");
    } catch {
      toast.error("Failed to withdraw application");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!pendingOffer) return;
    try {
      await jobOfferService.rejectJobOffer(pendingOffer.uuid);
      toast.success("Job offer rejected.");
      setPendingOffer(null);
    } catch (error) {
      toast.error("Failed to reject offer.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="flex gap-8">
          <div className="w-2/3 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="w-1/3 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!startup) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Hero Section */}
      <div className="relative h-72 md:h-96 w-full bg-muted">
        {startup.coverUrl ? (
          <img src={getImageUrl(startup.coverUrl)} alt="Cover" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 max-w-6xl mx-auto">
          <Link to="/talent/startups">
            <Button variant="secondary" size="icon" className="rounded-full bg-transparent backdrop-blur hover:bg-transparent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-3">
            <Button variant="secondary" size="icon" onClick={handleShare} className="rounded-full bg-transparent backdrop-blur hover:bg-transparent">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleBookmark} 
              disabled={bookmarking}
              className={`rounded-full backdrop-blur hover:bg-transparent transition-colors ${isBookmarked ? 'bg-primary/20 text-primary' : 'bg-transparent'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-background glass-card shadow-lg flex items-center justify-center overflow-hidden shrink-0">
            {startup.logoUrl ? (
              <img src={getImageUrl(startup.logoUrl)} alt="Logo" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <Globe className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">{startup.name}</h1>
              {startup.stage && <Badge variant="secondary" className="text-sm font-medium">{startup.stage.replace('_', ' ')}</Badge>}
              {startup.industry && <Badge className="text-sm font-medium">{startup.industry}</Badge>}
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              {startup.tagline || startup.pitch}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-10">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><Target className="text-primary"/> About the Idea</h2>
            
            {startup.problemStatement && (
              <Card className="border-l-4 border-l-destructive/50">
                <CardHeader className="pb-2"><CardTitle className="text-lg">The Problem</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground whitespace-pre-wrap">{startup.problemStatement}</CardContent>
              </Card>
            )}
            
            {startup.solution && (
              <Card className="border-l-4 border-l-emerald-500/50">
                <CardHeader className="pb-2"><CardTitle className="text-lg">The Solution</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground whitespace-pre-wrap">{startup.solution}</CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {startup.vision && (
                <div className="glass-card border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Lightbulb className="w-5 h-5 text-yellow-500" /> Vision</h3>
                  <p className="text-white/80 text-sm">{startup.vision}</p>
                </div>
              )}
              {startup.mission && (
                <div className="glass-card border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Rocket className="w-5 h-5 text-primary" /> Mission</h3>
                  <p className="text-white/80 text-sm">{startup.mission}</p>
                </div>
              )}
            </div>

            {startup.detailedDescription && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-4">Detailed Overview</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{startup.detailedDescription}</p>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><TrendingUp className="text-primary"/> Progress & Roadmap</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg text-muted-foreground">Current Progress</CardTitle></CardHeader>
                <CardContent className="font-medium">{startup.currentProgress || "Just starting out."}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg text-muted-foreground">Future Goals</CardTitle></CardHeader>
                <CardContent className="font-medium">{startup.futureGoals || "Building the MVP."}</CardContent>
              </Card>
            </div>
            {startup.roadmap && (
              <Card className="bg-muted/30">
                <CardHeader><CardTitle className="text-lg">Roadmap</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground whitespace-pre-wrap">{startup.roadmap}</CardContent>
              </Card>
            )}
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-lg">Join this Startup</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                {startup.isMember ? (
                  <Button variant="outline" className="w-full h-12 text-lg font-semibold text-green-600 border-green-200 bg-green-50" disabled>
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Already a Member
                  </Button>
                ) : appStatus && appStatus.status === 'PENDING' ? (
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full h-12 text-lg font-semibold text-yellow-600 border-yellow-200 bg-yellow-50" disabled>
                      <Clock className="w-5 h-5 mr-2" /> Application Pending
                    </Button>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleWithdraw} disabled={withdrawing}>
                      Withdraw Application
                    </Button>
                  </div>
                ) : appStatus && appStatus.status === 'ACCEPTED' ? (
                  <Button variant="outline" className="w-full h-12 text-lg font-semibold text-green-600 border-green-200 bg-green-50" disabled>
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Application Accepted
                  </Button>
                ) : pendingOffer ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary mb-2">
                      <Briefcase className="inline w-4 h-4 mr-1" />
                      <strong>Job Offer Received:</strong> The founder has invited you to join this startup!
                    </div>
                    <Link to={`/talent/startups/${startup.uuid}/apply?offer=${pendingOffer.uuid}`} className="block">
                      <Button className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600">
                        Apply Now
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleRejectOffer} className="w-full h-12 text-lg font-semibold text-destructive hover:text-destructive hover:bg-destructive/10">
                      Reject Offer
                    </Button>
                  </div>
                ) : startup.applicationsOpen === false ? (
                  <Button variant="outline" className="w-full h-12 text-lg font-semibold text-red-600 border-red-200 bg-red-50" disabled>
                    Applications Closed
                  </Button>
                ) : (
                  <Link to={`/talent/startups/${startup.uuid}/apply`}>
                    <Button className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/25">
                      {appStatus && (appStatus.status === 'WITHDRAWN' || appStatus.status === 'REJECTED') ? 'Apply' : 'Apply Now'}
                    </Button>
                  </Link>
                )}
                {!appStatus && !pendingOffer && startup.applicationsOpen !== false && (
                  <div className="text-center mt-3">
                    {startup.availableSlots !== undefined && (
                      <p className="text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-full py-1 px-3 inline-block mb-2 shadow-sm">
                        {startup.availableSlots} slot{startup.availableSlots === 1 ? '' : 's'} available
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Join the founder and help build this idea.</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-md"><Briefcase className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold">Roles Needed</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {startup.roles?.length ? startup.roles.map(r => (
                        <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                      )) : <span className="text-xs text-muted-foreground">Open</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-md"><Target className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold">Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {startup.skills?.length ? startup.skills.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                      )) : <span className="text-xs text-muted-foreground">Any</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-md"><MapPin className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold">Location & Work Type</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {startup.workType || "Remote"} {startup.city ? `· ${startup.city}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-md"><CalendarDays className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold">Commitment</p>
                    <p className="text-xs text-muted-foreground mt-1">{startup.commitmentType ? startup.commitmentType.replace('_', ' ') : "Flexible"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5"/> The Founder</CardTitle></CardHeader>
            <CardContent>
              <Link to={`/talent/profile/${startup.founderUuid}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity block group">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg text-primary uppercase">
                  {startup.founderName.substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold group-hover:underline">{startup.founderName}</p>
                  <p className="text-xs text-muted-foreground flex items-center"><CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1"/> Verified Founder</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {startup.attachments && startup.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5"/> Resources</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {startup.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                    <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{att.fileName || att.type}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{att.url}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
