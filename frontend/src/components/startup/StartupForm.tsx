import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MultiSelectAutocomplete } from "@/components/ui/multi-select-autocomplete";
import { Loader2, Save, Send, Image as ImageIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { startupService } from "@/services/myStartupService";
import { fileService } from "@/services/fileService";
import { getImageUrl } from "@/lib/utils";

const startupSchema = z.object({
  name: z.string().min(1, "Startup name is required"),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  tagline: z.string().optional(),
  pitch: z.string().optional(),
  problemStatement: z.string().optional(),
  solution: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  detailedDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  businessModel: z.string().optional(),
  revenueModel: z.string().optional(),
  currentProgress: z.string().optional(),
  roadmap: z.string().optional(),
  futureGoals: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  teamSize: z.string().optional(),
  expectedTeamSize: z.string().optional(),
  timeline: z.string().optional(),
  launchGoal: z.string().optional(),
  commitmentType: z.string().optional(),
  workType: z.string().optional(),
  city: z.string().optional(),
  equityAvailable: z.string().optional(),
  equityPercentage: z.string().optional(),
  roles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  attachments: z.array(
    z.object({
      type: z.string(),
      url: z.string(),
      fileName: z.string().optional()
    })
  ).optional()
});

type StartupFormValues = z.infer<typeof startupSchema>;

interface StartupFormProps {
  startupId?: string;
}

const COMMON_SKILLS = [
  // Programming Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP",
  // Frontend
  "React", "Vue", "Angular", "Svelte", "Next.js", "Tailwind CSS", "HTML/CSS", "Redux",
  // Backend & Databases
  "Node.js", "Spring Boot", "Django", "Flask", "Express", "GraphQL", "REST API", "PostgreSQL", "MongoDB", "MySQL", "Redis",
  // DevOps & Cloud
  "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "CI/CD", "Linux", "Terraform",
  // Mobile
  "Flutter", "React Native", "iOS", "Android",
  // Data & AI
  "Machine Learning", "Data Science", "AI/LLM", "TensorFlow", "PyTorch", "Data Analytics",
  // Design
  "Figma", "UI/UX Design", "Graphic Design", "Adobe Creative Suite", "Prototyping",
  // Business & Other
  "Product Management", "Project Management", "Marketing", "Sales", "SEO", "Content Creation", "Copywriting", "Financial Modeling"
];

const ROLES = [
  // Engineering
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer", "Flutter Developer", 
  "Android Developer", "iOS Developer", "DevOps Engineer", "Cloud Architect", "Security Engineer",
  // Data & AI
  "AI Engineer", "ML Engineer", "Data Scientist", "Data Analyst", "Data Engineer",
  // Design
  "UI/UX Designer", "Product Designer", "Graphic Designer", "Video Editor", "Motion Designer",
  // Product & Management
  "Product Manager", "Project Manager", "Scrum Master", "Business Analyst",
  // Business, Sales & Marketing
  "Marketing Manager", "Growth Hacker", "Sales Representative", "Account Executive", 
  "Business Development", "Finance / CFO", "Legal Counsel", "Content Creator", "Social Media Manager", "Copywriter",
  // Executive
  "Co-Founder", "CTO", "CEO", "COO", "CMO"
];

export function StartupForm({ startupId }: StartupFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!startupId);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const url = await fileService.uploadFile(file);
      form.setValue("logoUrl", url);
      toast.success("Logo uploaded successfully");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const url = await fileService.uploadFile(file);
      form.setValue("coverUrl", url);
      toast.success("Cover uploaded successfully");
    } catch {
      toast.error("Failed to upload cover");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const form = useForm<StartupFormValues>({
    resolver: zodResolver(startupSchema),
    defaultValues: {
      name: "", tagline: "", roles: [], skills: [], attachments: []
    }
  });

  useEffect(() => {
    if (startupId) {
      startupService.getStartup(startupId).then(data => {
        form.reset({
          name: data.name || "",
          logoUrl: data.logoUrl || "",
          coverUrl: data.coverUrl || "",
          tagline: data.tagline || "",
          pitch: data.pitch || "",
          problemStatement: data.problemStatement || "",
          solution: data.solution || "",
          vision: data.vision || "",
          mission: data.mission || "",
          detailedDescription: data.detailedDescription || "",
          targetAudience: data.targetAudience || "",
          businessModel: data.businessModel || "",
          revenueModel: data.revenueModel || "",
          currentProgress: data.currentProgress || "",
          roadmap: data.roadmap || "",
          futureGoals: data.futureGoals || "",
          industry: data.industry || "",
          stage: data.stage || "",
          teamSize: data.teamSize || "",
          expectedTeamSize: data.expectedTeamSize || "",
          timeline: data.timeline || "",
          launchGoal: data.launchGoal || "",
          commitmentType: data.commitmentType || "",
          workType: data.workType || "",
          city: data.city || "",
          equityAvailable: data.equityAvailable || "",
          equityPercentage: data.equityPercentage || "",
          roles: data.roles || [],
          skills: data.skills || [],
          attachments: data.attachments || []
        });
      }).catch(() => {
        toast.error("Failed to load startup details");
        navigate("/founder/startups");
      }).finally(() => {
        setInitialLoading(false);
      });
    }
  }, [startupId, form, navigate]);

  const onSubmit = async (values: StartupFormValues, status: 'DRAFT' | 'PUBLISHED') => {
    setLoading(true);
    try {
      // Clean up empty strings to avoid Jackson enum parsing errors
      const cleanValues = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? undefined : v])
      );
      const payload = { ...cleanValues, status };
      if (startupId) {
        await startupService.updateStartup(startupId, payload as any);
        toast.success(`Startup ${status === 'PUBLISHED' ? 'published' : 'updated'} successfully`);
      } else {
        await startupService.createStartup(payload as any);
        toast.success(`Startup ${status === 'PUBLISHED' ? 'published' : 'created as draft'}`);
      }
      navigate("/founder/startups");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <form className="space-y-8 pb-40">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-12">
          <TabsTrigger value="basic" className="text-sm">Basic Info</TabsTrigger>
          <TabsTrigger value="description" className="text-sm">Description</TabsTrigger>
          <TabsTrigger value="info" className="text-sm">Info & Work</TabsTrigger>
          <TabsTrigger value="requirements" className="text-sm">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Startup Name <span className="text-destructive">*</span></Label>
                <Input {...form.register("name")} placeholder="e.g. SYNERGi" />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {form.watch("logoUrl") ? (
                      <div className="h-16 w-16 shrink-0 rounded-xl border border-border overflow-hidden bg-background">
                        <img src={getImageUrl(form.watch("logoUrl"))} alt="Logo" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/30">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="relative">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                        />
                        <Button type="button" variant="outline" className="w-full gap-2 pointer-events-none" disabled={isUploadingLogo}>
                          {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Recommended: 256x256px. PNG, JPG or WEBP.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex flex-col gap-4">
                    {form.watch("coverUrl") && (
                      <div className="h-24 w-full rounded-xl border border-border overflow-hidden bg-background">
                        <img src={getImageUrl(form.watch("coverUrl"))} alt="Cover" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="relative">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleCoverUpload}
                        disabled={isUploadingCover}
                      />
                      <Button type="button" variant="outline" className="w-full gap-2 pointer-events-none" disabled={isUploadingCover}>
                        {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploadingCover ? "Uploading..." : "Upload Cover Image"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tagline (One-line)</Label>
                <Input {...form.register("tagline")} placeholder="Connecting founders and talents..." />
              </div>
              <div className="space-y-2">
                <Label>Elevator Pitch</Label>
                <Textarea {...form.register("pitch")} placeholder="A brief pitch of your idea..." className="h-24" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Problem Statement</Label>
                <Textarea {...form.register("problemStatement")} placeholder="What problem are you solving?" />
              </div>
              <div className="space-y-2">
                <Label>Solution</Label>
                <Textarea {...form.register("solution")} placeholder="How does your startup solve it?" />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Vision</Label>
                  <Textarea {...form.register("vision")} />
                </div>
                <div className="space-y-2">
                  <Label>Mission</Label>
                  <Textarea {...form.register("mission")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <Textarea {...form.register("detailedDescription")} className="h-32" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input {...form.register("industry")} placeholder="e.g. EdTech, SaaS" />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select onValueChange={(v) => form.setValue("stage", v)} defaultValue={form.getValues("stage")}>
                    <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDEA">Idea</SelectItem>
                      <SelectItem value="PROTOTYPE">Prototype</SelectItem>
                      <SelectItem value="MVP">MVP</SelectItem>
                      <SelectItem value="EARLY_TRACTION">Early Traction</SelectItem>
                      <SelectItem value="GROWTH">Growth</SelectItem>
                      <SelectItem value="SCALING">Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Work Type</Label>
                  <Select onValueChange={(v) => form.setValue("workType", v)} defaultValue={form.getValues("workType")}>
                    <SelectTrigger><SelectValue placeholder="Select Work Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="ONSITE">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Commitment</Label>
                  <Select onValueChange={(v) => form.setValue("commitmentType", v)} defaultValue={form.getValues("commitmentType")}>
                    <SelectTrigger><SelectValue placeholder="Select Commitment" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City (if On-site/Hybrid)</Label>
                  <Input {...form.register("city")} placeholder="e.g. San Francisco" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card className="overflow-visible">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Roles Required</Label>
                <MultiSelectAutocomplete 
                  options={ROLES} 
                  value={form.watch("roles") || []} 
                  onChange={(v) => form.setValue("roles", v)} 
                  placeholder="Select roles needed..." 
                />
              </div>
              <div className="space-y-2">
                <Label>Skills Required (Tags)</Label>
                <MultiSelectAutocomplete 
                  options={COMMON_SKILLS} 
                  value={form.watch("skills") || []} 
                  onChange={(v) => form.setValue("skills", v)} 
                  placeholder="Select skills needed..." 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent backdrop-blur-md border-t flex justify-end gap-4 z-10 lg:pl-64">
        <Button 
          type="button" 
          variant="outline" 
          disabled={loading}
          onClick={form.handleSubmit((v) => onSubmit(v as StartupFormValues, 'DRAFT'))}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save as Draft
        </Button>
        <Button 
          type="button" 
          disabled={loading}
          onClick={form.handleSubmit((v) => onSubmit(v as StartupFormValues, 'PUBLISHED'))}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Publish Startup
        </Button>
      </div>
    </form>
  );
}
