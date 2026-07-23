import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { talentStartupService } from "@/services/talentStartupService";
import { talentApplicationService } from "@/services/talentApplicationService";
import type { ApplicationRequest } from "@/services/talentApplicationService";
import { jobOfferService } from "@/services/jobOfferService";
import { toast } from "sonner";
import { ArrowLeft, Rocket, Briefcase, Link as LinkIcon, Calendar } from "lucide-react";
import type { ExploreStartupResponse } from "@/services/talentStartupService";

export default function ApplyToStartup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerUuid = searchParams.get('offer');
  
  const [startup, setStartup] = useState<ExploreStartupResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ApplicationRequest>({
    introduction: "",
    whyJoin: "",
    whyRightFit: "",
    preferredRole: "",
    yearsExperience: "",
    currentOccupation: "",
    skills: "",
    technologiesKnown: "",
    resumeUrl: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    personalWebsiteUrl: "",
    hoursAvailable: "",
    preferredWorkingStyle: "",
    availableStartDate: "",
    previousStartupExperience: "",
    openSourceContributions: "",
    achievements: "",
    additionalNotes: "",
  });

  useEffect(() => {
    if (id) {
      talentStartupService.getStartupDetails(id).then((data) => {
        if (!data) {
          navigate("/talent/startups", { replace: true });
          return;
        }
        setStartup(data);
      }).catch(() => {
        toast.error("Failed to load startup details");
        navigate("/talent/startups", { replace: true });
      });
      
      // Check if already applied
      talentApplicationService.getApplicationStatus(id).then(status => {
        if (status && ['PENDING', 'ACCEPTED', 'SHORTLISTED'].includes(status.status)) {
          toast.info("You have already applied to this startup and it is currently active");
          navigate("/talent/applications", { replace: true });
        }
      });
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (!formData.introduction || !formData.whyJoin || !formData.whyRightFit || !formData.preferredRole || !formData.skills) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      if (offerUuid) {
        await jobOfferService.applyToJobOffer(offerUuid, formData);
      } else {
        await talentApplicationService.apply(id, formData);
      }
      toast.success("Application submitted successfully!");
      navigate("/talent/applications", { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (!startup) return <div className="p-20 text-center animate-pulse">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8">
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Apply to {startup.name}</h1>
          <p className="text-white/80 mt-1">Convince the founder that you're the perfect fit.</p>
        </div>
      </div>

      {startup.applicationsOpen === false && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
          Applications are closed. This workspace has reached its maximum member capacity.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-primary" /> Personal Introduction</CardTitle>
            <CardDescription>Tell the founder about yourself and why you're passionate about this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Short Introduction <span className="text-destructive">*</span></Label>
              <Textarea name="introduction" value={formData.introduction} onChange={handleChange} placeholder="Who are you?" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label>Why do you want to join this startup? <span className="text-destructive">*</span></Label>
              <Textarea name="whyJoin" value={formData.whyJoin} onChange={handleChange} placeholder="What excites you about this idea?" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label>Why are you the right fit? <span className="text-destructive">*</span></Label>
              <Textarea name="whyRightFit" value={formData.whyRightFit} onChange={handleChange} placeholder="What unique value do you bring?" rows={3} required />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Preferred Role <span className="text-destructive">*</span></Label>
                <Input name="preferredRole" value={formData.preferredRole} onChange={handleChange} placeholder="e.g. Frontend Developer" required />
              </div>
              <div className="space-y-2">
                <Label>Current Occupation</Label>
                <Input name="currentOccupation" value={formData.currentOccupation} onChange={handleChange} placeholder="e.g. Student / Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} placeholder="e.g. 3 years" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Core Skills (comma separated) <span className="text-destructive">*</span></Label>
              <Input name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. React, Node.js, UI Design" required />
            </div>
            <div className="space-y-2">
              <Label>Technologies Known</Label>
              <Input name="technologiesKnown" value={formData.technologiesKnown} onChange={handleChange} placeholder="e.g. AWS, Docker, Figma" />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Portfolio & Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-primary" /> Links & Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Resume Link (Google Drive, Dropbox, etc.)</Label>
              <Input type="url" name="resumeUrl" value={formData.resumeUrl} onChange={handleChange} placeholder="https://" />
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input type="url" name="githubUrl" value={formData.githubUrl} onChange={handleChange} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Portfolio URL</Label>
                <Input type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label>Personal Website</Label>
                <Input type="url" name="personalWebsiteUrl" value={formData.personalWebsiteUrl} onChange={handleChange} placeholder="https://" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Hours Available per Week</Label>
                <Input name="hoursAvailable" value={formData.hoursAvailable} onChange={handleChange} placeholder="e.g. 20 hours" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Working Style</Label>
                <Input name="preferredWorkingStyle" value={formData.preferredWorkingStyle} onChange={handleChange} placeholder="e.g. Async / Synchronous" />
              </div>
              <div className="space-y-2">
                <Label>Available Start Date</Label>
                <Input name="availableStartDate" value={formData.availableStartDate} onChange={handleChange} placeholder="e.g. Immediately, Next month" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={submitting || startup.applicationsOpen === false} className="min-w-[150px]">
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>

      </form>
    </div>
  );
}
