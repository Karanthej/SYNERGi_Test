import { useState } from "react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const SKILL_CATEGORIES = [
  {
    name: "Programming Languages",
    skills: ["C", "C++", "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "HTML", "CSS"]
  },
  {
    name: "Databases",
    skills: ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis", "Firebase"]
  },
  {
    name: "Web Development",
    skills: ["React", "Next.js", "Angular", "Vue", "Node.js", "Express", "Spring Boot", "Django", "Flask", "Laravel"]
  },
  {
    name: "Mobile",
    skills: ["Android", "Flutter", "React Native", "SwiftUI"]
  },
  {
    name: "Testing",
    skills: ["JUnit", "Selenium", "Cypress", "Playwright", "API Testing", "Manual Testing", "Automation Testing"]
  },
  {
    name: "DSA",
    skills: ["Arrays", "Strings", "Linked List", "Stack", "Queue", "Tree", "Graph", "HashMap", "Dynamic Programming", "Greedy", "Recursion", "Backtracking", "Bit Manipulation", "Competitive Programming"]
  },
  {
    name: "Artificial Intelligence",
    skills: ["Machine Learning", "Deep Learning", "NLP", "LLM", "Prompt Engineering", "Computer Vision"]
  },
  {
    name: "Infrastructure & Security",
    skills: ["Cyber Security", "Networking", "Linux", "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud"]
  },
  {
    name: "Soft Skills",
    skills: ["Leadership", "Communication", "Problem Solving", "Team Work", "Project Management"]
  }
];

export default function StepSkills({ onNext, onBack }: Props) {
  const { skills, setSkills } = useOnboardingStore();
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set(skills));

  const toggleSkill = (skill: string) => {
    const next = new Set(selectedSkills);
    if (next.has(skill)) {
      next.delete(skill);
    } else {
      next.add(skill);
    }
    setSelectedSkills(next);
  };

  const handleNext = () => {
    setSkills(Array.from(selectedSkills));
    onNext();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 flex flex-col h-[80vh]"
    >
      <div>
        <h2 className="text-2xl font-bold">Skills Selection</h2>
        <p className="text-muted-foreground">Select all the skills you possess.</p>
      </div>

      {selectedSkills.size > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Selected Skills ({selectedSkills.size})</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedSkills).map(skill => (
              <Badge key={skill} variant="default" className="cursor-pointer bg-primary" onClick={() => toggleSkill(skill)}>
                {skill} <Check className="ml-1 w-3 h-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 pr-4 border rounded-lg p-4">
        <div className="space-y-8">
          {SKILL_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-1">{category.name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => {
                  const isSelected = selectedSkills.has(skill);
                  return (
                    <Badge 
                      key={skill} 
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 transition-colors ${isSelected ? 'bg-primary' : 'hover:bg-accent'}`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={selectedSkills.size === 0}>Next Step</Button>
      </div>
    </motion.div>
  );
}
