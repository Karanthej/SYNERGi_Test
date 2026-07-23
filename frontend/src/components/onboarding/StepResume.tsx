import { useForm } from "react-hook-form";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function StepResume({ onNext, onBack }: Props) {
  const { resume, setResume } = useOnboardingStore();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: resume,
  });

  const cvFiles = watch("cv");
  const portfolioFiles = watch("portfolioDoc");

  const getFileName = (files: any) => {
    if (files && files.length > 0 && files[0] instanceof File) {
      return files[0].name;
    }
    return null;
  };

  const onSubmit = (data: any) => {
    setResume(data);
    onNext();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Upload Resume & Links</h2>
        <p className="text-muted-foreground">Provide your professional documents and profiles.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`space-y-2 border-2 border-dashed p-4 rounded-xl text-center transition-colors ${getFileName(cvFiles) ? 'border-primary bg-primary/5' : 'bg-accent/5 hover:bg-accent/10'}`}>
                <Label htmlFor="cv" className="cursor-pointer flex flex-col items-center justify-center h-24">
                  {getFileName(cvFiles) ? (
                    <>
                      <span className="font-semibold text-lg text-primary truncate max-w-[200px]">{getFileName(cvFiles)}</span>
                      <span className="text-sm text-primary/70 mt-1">Click to change file</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-lg text-primary">Upload CV</span>
                      <span className="text-sm text-muted-foreground mt-1">PDF, DOCX (Max 5MB)</span>
                    </>
                  )}
                </Label>
                <Input id="cv" type="file" className="hidden" accept=".pdf,.doc,.docx" {...register("cv")} />
              </div>

              <div className={`space-y-2 border-2 border-dashed p-4 rounded-xl text-center transition-colors ${getFileName(portfolioFiles) ? 'border-primary bg-primary/5' : 'bg-accent/5 hover:bg-accent/10'}`}>
                <Label htmlFor="portfolioDoc" className="cursor-pointer flex flex-col items-center justify-center h-24">
                  {getFileName(portfolioFiles) ? (
                    <>
                      <span className="font-semibold text-lg text-primary truncate max-w-[200px]">{getFileName(portfolioFiles)}</span>
                      <span className="text-sm text-primary/70 mt-1">Click to change file</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-lg text-primary">Upload Portfolio (Optional)</span>
                      <span className="text-sm text-muted-foreground mt-1">PDF (Max 10MB)</span>
                    </>
                  )}
                </Label>
                <Input id="portfolioDoc" type="file" className="hidden" accept=".pdf" {...register("portfolioDoc")} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Professional Links</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>GitHub Profile</Label>
                  <Input type="url" placeholder="https://github.com/..." {...register("github")} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn Profile</Label>
                  <Input type="url" placeholder="https://linkedin.com/in/..." {...register("linkedin")} />
                </div>
                <div className="space-y-2">
                  <Label>Personal Website / Portfolio URL</Label>
                  <Input type="url" placeholder="https://..." {...register("portfolio")} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>Back</Button>
          <Button type="submit">Next Step</Button>
        </div>
      </form>
    </motion.div>
  );
}
