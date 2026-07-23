import { useState } from "react";
import { useOnboardingStore, type StartupIdea } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Copy } from "lucide-react";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function StepSynergiIdeas({ onNext, onBack }: Props) {
  const { startupIdeas, setStartupIdeas } = useOnboardingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultIdea: StartupIdea = {
    id: "",
    name: "",
    logo: "",
    shortDescription: "",
    fullDescription: "",
    problemStatement: "",
    solution: "",
    industry: "",
    targetUsers: "",
    stage: "",
    requiredSkills: [],
    hiringProcess: "",
    location: "",
    workType: "Hybrid",
    openPositions: "1",
    deadline: ""
  };

  const [currentIdea, setCurrentIdea] = useState<StartupIdea>(defaultIdea);

  const handleOpenNew = () => {
    setCurrentIdea({ ...defaultIdea, id: crypto.randomUUID() });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (idea: StartupIdea) => {
    setCurrentIdea(idea);
    setEditingId(idea.id);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setStartupIdeas(startupIdeas.map(i => i.id === editingId ? currentIdea : i));
    } else {
      setStartupIdeas([...startupIdeas, currentIdea]);
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setStartupIdeas(startupIdeas.filter(i => i.id !== id));
  };

  const handleDuplicate = (idea: StartupIdea) => {
    const newIdea = { ...idea, id: crypto.randomUUID(), name: `${idea.name} (Copy)` };
    setStartupIdeas([...startupIdeas, newIdea]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Startup Ideas</h2>
        <p className="text-muted-foreground">Add your startup ideas and start building your team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startupIdeas.map((idea) => (
          <Card key={idea.id} className="relative group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl truncate pr-12">{idea.name || "Untitled Idea"}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">{idea.shortDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                  {idea.industry || "N/A"}
                </span>
                <span className="text-xs font-semibold bg-secondary px-2 py-1 rounded">
                  {idea.stage || "Idea Phase"}
                </span>
              </div>
            </CardContent>
            
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenEdit(idea)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDuplicate(idea)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(idea.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Card className="border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-accent/5 transition-colors min-h-[160px]" onClick={handleOpenNew}>
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 text-muted-foreground">
                <Plus className="h-8 w-8 mb-2" />
                <span>Add New Startup Idea</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Startup Idea" : "Add New Startup Idea"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Startup Name</Label>
                <Input value={currentIdea.name} onChange={e => setCurrentIdea({...currentIdea, name: e.target.value})} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={currentIdea.industry} onChange={e => setCurrentIdea({...currentIdea, industry: e.target.value})} placeholder="e.g. EdTech, FinTech" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Short Description</Label>
                <Input value={currentIdea.shortDescription} onChange={e => setCurrentIdea({...currentIdea, shortDescription: e.target.value})} placeholder="A brief one-liner" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Problem Statement</Label>
                <Input value={currentIdea.problemStatement} onChange={e => setCurrentIdea({...currentIdea, problemStatement: e.target.value})} placeholder="What problem are you solving?" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Solution</Label>
                <Input value={currentIdea.solution} onChange={e => setCurrentIdea({...currentIdea, solution: e.target.value})} placeholder="How do you solve it?" />
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Input value={currentIdea.stage} onChange={e => setCurrentIdea({...currentIdea, stage: e.target.value})} placeholder="e.g. MVP, Ideation" />
              </div>
              <div className="space-y-2">
                <Label>Work Type</Label>
                <Input value={currentIdea.workType} onChange={e => setCurrentIdea({...currentIdea, workType: e.target.value})} placeholder="Remote, Hybrid, Onsite" />
              </div>
              <div className="space-y-2">
                <Label>Open Positions</Label>
                <Input type="number" value={currentIdea.openPositions} onChange={e => setCurrentIdea({...currentIdea, openPositions: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Application Deadline</Label>
                <Input type="date" value={currentIdea.deadline} onChange={e => setCurrentIdea({...currentIdea, deadline: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Idea</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={startupIdeas.length === 0}>Next Step</Button>
      </div>
    </motion.div>
  );
}
