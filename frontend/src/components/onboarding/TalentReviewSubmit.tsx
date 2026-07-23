import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";

interface Props {
  onBack: () => void;
}

export default function TalentReviewSubmit({ onBack }: Props) {
  const { personalInfo, education, hasWorkExperience, workExperience, skills, resume, resetStore } = useOnboardingStore();
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        phoneNumber: personalInfo.phone || undefined,
        city: personalInfo.city || undefined,
        country: personalInfo.country || undefined,
        education: education.map(e => `${e.highestQualification} in ${e.branch} from ${e.university} (${e.graduationYear})`),
        experience: hasWorkExperience ? workExperience.map(e => `${e.role} at ${e.companyName} (${e.years} years)`) : [],
        skills: skills,
        githubUrl: resume.github || undefined,
        linkedinUrl: resume.linkedin || undefined,
        portfolioUrl: resume.portfolio || undefined,
        role: "TALENT"
      };

      await apiClient.put("/profile", payload);
      // Update both role and isProfileComplete so ProtectedRoute lets us through
      updateUser({ isProfileComplete: true, role: "TALENT" });
      resetStore();
      navigate("/talent/dashboard", { replace: true });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to save profile. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Review Your Information</h2>
        <p className="text-muted-foreground">Please review your details before creating your account.</p>
      </div>

      {submitError && (
        <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <p>{submitError}</p>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {personalInfo.fullName}</div>
            <div><span className="text-muted-foreground">Username:</span> {user?.username ? `@${user.username}` : "Not set"}</div>
            <div><span className="text-muted-foreground">Email:</span> {personalInfo.email}</div>
            <div><span className="text-muted-foreground">Phone:</span> {personalInfo.phone}</div>
            <div><span className="text-muted-foreground">Location:</span> {personalInfo.city}, {personalInfo.country}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.map(edu => (
              <div key={edu.id} className="text-sm">
                <div className="font-semibold">{edu.highestQualification} in {edu.branch}</div>
                <div className="text-muted-foreground">{edu.university} • Class of {edu.graduationYear}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Work Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasWorkExperience ? (
              <div className="text-sm text-muted-foreground">No prior work experience (0 years)</div>
            ) : (
              workExperience.map(exp => (
                <div key={exp.id} className="text-sm">
                  <div className="font-semibold">{exp.role} at {exp.companyName}</div>
                  <div className="text-muted-foreground">{exp.years} Years • {exp.currentCompany ? 'Present' : 'Past'}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills ({skills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links & Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
             <div><span className="font-semibold text-foreground">GitHub:</span> {resume.github || "N/A"}</div>
             <div><span className="font-semibold text-foreground">LinkedIn:</span> {resume.linkedin || "N/A"}</div>
             <div><span className="font-semibold text-foreground">Portfolio:</span> {resume.portfolio || "N/A"}</div>
             <div className="pt-2 text-primary">CV Uploaded</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit} size="lg" className="px-8" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Submit & Create Account"}
        </Button>
      </div>
    </motion.div>
  );
}
