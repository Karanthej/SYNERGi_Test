import { useState } from "react";
import { useOnboardingStore, type WorkExperience } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function StepWorkExperience({ onNext, onBack }: Props) {
  const { hasWorkExperience, setHasWorkExperience, workExperience, setWorkExperience } = useOnboardingStore();
  
  const [hasExp, setHasExp] = useState<"yes" | "no" | null>(
    hasWorkExperience === true ? "yes" : hasWorkExperience === false ? "no" : null
  );

  const [entries, setEntries] = useState<WorkExperience[]>(
    workExperience.length > 0 
      ? workExperience 
      : [{ id: crypto.randomUUID(), companyName: "", role: "", years: "", responsibilities: "", currentCompany: false }]
  );

  const handleAdd = () => {
    setEntries([...entries, { id: crypto.randomUUID(), companyName: "", role: "", years: "", responsibilities: "", currentCompany: false }]);
  };

  const handleRemove = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleChange = (id: string, field: keyof WorkExperience, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleNext = () => {
    if (hasExp === "no") {
      setHasWorkExperience(false);
      setWorkExperience([]);
    } else if (hasExp === "yes") {
      setHasWorkExperience(true);
      const validEntries = entries.filter(e => e.companyName || e.role);
      setWorkExperience(validEntries);
    }
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
        <h2 className="text-2xl font-bold">Work Experience</h2>
        <p className="text-muted-foreground">Tell us about your professional background.</p>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">Do you have work experience?</Label>
        <RadioGroup 
          value={hasExp || ""} 
          onValueChange={(v) => setHasExp(v as "yes" | "no")}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-accent/5" onClick={() => setHasExp("yes")}>
            <RadioGroupItem value="yes" id="r1" />
            <Label htmlFor="r1" className="cursor-pointer">Yes, I have work experience</Label>
          </div>
          <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-accent/5" onClick={() => setHasExp("no")}>
            <RadioGroupItem value="no" id="r2" />
            <Label htmlFor="r2" className="cursor-pointer">No, I don't have work experience (0 years)</Label>
          </div>
        </RadioGroup>
      </div>

      {hasExp === "yes" && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: "auto" }} 
          className="space-y-6 pt-4"
        >
          {entries.map((entry, _index) => (
            <Card key={entry.id} className="relative">
              {entries.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    placeholder="e.g. Google" 
                    value={entry.companyName}
                    onChange={(e) => handleChange(entry.id, "companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role / Designation</Label>
                  <Input 
                    placeholder="e.g. Software Engineer" 
                    value={entry.role}
                    onChange={(e) => handleChange(entry.id, "role", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input 
                    type="number"
                    placeholder="e.g. 2" 
                    value={entry.years}
                    onChange={(e) => handleChange(entry.id, "years", e.target.value)}
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox 
                      id={`current-${entry.id}`} 
                      checked={entry.currentCompany}
                      onCheckedChange={(c) => handleChange(entry.id, "currentCompany", !!c)}
                    />
                    <Label htmlFor={`current-${entry.id}`}>I currently work here</Label>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Responsibilities (Optional)</Label>
                  <Input 
                    placeholder="Describe your key contributions..." 
                    value={entry.responsibilities}
                    onChange={(e) => handleChange(entry.id, "responsibilities", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={handleAdd} className="w-full border-dashed border-2">
            <Plus className="mr-2 h-4 w-4" /> Add Another Experience
          </Button>
        </motion.div>
      )}

      {hasExp === "no" && (
        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground mt-4">
          If no experience is selected, 0 years will be saved automatically.
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={hasExp === null}>Next Step</Button>
      </div>
    </motion.div>
  );
}
