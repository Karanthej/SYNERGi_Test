import { useState } from "react";
import { useOnboardingStore, type Education } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function StepEducation({ onNext, onBack }: Props) {
  const { education, setEducation } = useOnboardingStore();
  
  // Initialize with one empty entry if empty
  const [entries, setEntries] = useState<Education[]>(
    education.length > 0 
      ? education 
      : [{ id: crypto.randomUUID(), highestQualification: "", university: "", branch: "", graduationYear: "", cgpa: "" }]
  );

  const handleAdd = () => {
    setEntries([...entries, { id: crypto.randomUUID(), highestQualification: "", university: "", branch: "", graduationYear: "", cgpa: "" }]);
  };

  const handleRemove = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleChange = (id: string, field: keyof Education, value: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleNext = () => {
    // Basic validation: filter out completely empty entries
    const validEntries = entries.filter(e => e.highestQualification || e.university);
    setEducation(validEntries);
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
        <h2 className="text-2xl font-bold">Education Details</h2>
        <p className="text-muted-foreground">Tell us about your academic background.</p>
      </div>

      <div className="space-y-6">
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
                <Label>Highest Qualification</Label>
                <Input 
                  placeholder="e.g. B.Tech, MBA" 
                  value={entry.highestQualification}
                  onChange={(e) => handleChange(entry.id, "highestQualification", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>University / College</Label>
                <Input 
                  placeholder="e.g. Stanford University" 
                  value={entry.university}
                  onChange={(e) => handleChange(entry.id, "university", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Branch / Specialization</Label>
                <Input 
                  placeholder="e.g. Computer Science" 
                  value={entry.branch}
                  onChange={(e) => handleChange(entry.id, "branch", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input 
                    type="number" 
                    placeholder="2024" 
                    value={entry.graduationYear}
                    onChange={(e) => handleChange(entry.id, "graduationYear", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CGPA / Percentage</Label>
                  <Input 
                    placeholder="9.5 or 95%" 
                    value={entry.cgpa}
                    onChange={(e) => handleChange(entry.id, "cgpa", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={handleAdd} className="w-full border-dashed border-2">
        <Plus className="mr-2 h-4 w-4" /> Add Another Education
      </Button>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next Step</Button>
      </div>
    </motion.div>
  );
}
