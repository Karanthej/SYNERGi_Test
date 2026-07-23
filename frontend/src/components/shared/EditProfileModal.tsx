import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { settingsService } from "@/services/settingsService";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  onSave: () => void;
}

export function EditProfileModal({ isOpen, onClose, profileData, onSave }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    city: "",
    country: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
    linkedinUrl: "",
    githubUrl: ""
  });

  useEffect(() => {
    if (profileData && isOpen) {
      setFormData({
        fullName: profileData.user?.fullName || "",
        bio: profileData.profile?.bio || "",
        city: profileData.profile?.city || "",
        country: profileData.profile?.country || "",
        skills: profileData.profile?.skills?.join(", ") || "",
        experience: profileData.profile?.experience?.join("\n") || "",
        projects: profileData.profile?.projects?.join("\n") || "",
        education: profileData.profile?.education?.join("\n") || "",
        linkedinUrl: profileData.profile?.linkedinUrl || "",
        githubUrl: profileData.profile?.githubUrl || ""
      });
    }
  }, [profileData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const payload = {
        fullName: formData.fullName,
        bio: formData.bio,
        city: formData.city,
        country: formData.country,
        skills: formData.skills ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        experience: formData.experience ? formData.experience.split("\n").map(e => e.trim()).filter(Boolean) : [],
        projects: formData.projects ? formData.projects.split("\n").map(p => p.trim()).filter(Boolean) : [],
        education: formData.education ? formData.education.split("\n").map(e => e.trim()).filter(Boolean) : [],
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl
      };

      await settingsService.updateProfile(payload);
      updateUser({ fullName: payload.fullName });
      toast.success("Profile updated successfully");
      onSave();
      onClose();
    } catch (error) {
      /* console.error removed */
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Full Name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right text-muted-foreground">
              Username
            </Label>
            <Input
              id="username"
              value={profileData?.user?.username ? `@${profileData.user.username}` : ""}
              disabled
              className="col-span-3 bg-muted"
              title="Username cannot be changed"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Bio / Overview
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="country" className="text-right">
              Country
            </Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkedinUrl" className="text-right">
              LinkedIn URL
            </Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              className="col-span-3"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="githubUrl" className="text-right">
              GitHub URL
            </Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleChange}
              className="col-span-3"
              placeholder="https://github.com/yourusername"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skills" className="text-right">
              Skills (comma separated)
            </Label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="col-span-3"
              placeholder="React, Java, Spring Boot"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="experience" className="text-right mt-2">
              Experience (one per line)
            </Label>
            <Textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="col-span-3 min-h-[100px]"
              placeholder="Software Engineer at Acme Corp (2020-2023)"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="projects" className="text-right mt-2">
              Projects (one per line)
            </Label>
            <Textarea
              id="projects"
              name="projects"
              value={formData.projects}
              onChange={handleChange}
              className="col-span-3 min-h-[100px]"
              placeholder="Built a scalable microservices architecture"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="education" className="text-right mt-2">
              Education (one per line)
            </Label>
            <Textarea
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="col-span-3 min-h-[100px]"
              placeholder="B.S. Computer Science, University X"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
