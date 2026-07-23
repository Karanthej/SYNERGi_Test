// @ts-nocheck
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StepPersonalInfo from "@/components/onboarding/StepPersonalInfo";
import StepEducation from "@/components/onboarding/StepEducation";
import StepWorkExperience from "@/components/onboarding/StepWorkExperience";
import StepSkills from "@/components/onboarding/StepSkills";
import StepResume from "@/components/onboarding/StepResume";
import StepUsername from "@/components/onboarding/StepUsername";
import TalentReviewSubmit from "@/components/onboarding/TalentReviewSubmit";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut } from "lucide-react";

const steps = [
  "Personal Info",
  "Education",
  "Work Experience",
  "Skills & Expertise",
  "Resume & Links",
  "Username",
  "Review & Submit"
];

export default function TalentFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const { signOut } = useAuth();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSignOut = () => {
    signOut().then(() => {
      clearAuth();
      navigate("/login");
    });
  };

  return (
    <div className="min-h-[100dvh] bg-transparent flex">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex w-64 flex-col glass-card border-r px-4 py-8 h-[100dvh] sticky top-0">
        <Link to="/" className="flex items-center mb-12 px-2">
          <img src="/synergi-logo.png" alt="SYNERGi" className="h-10" />
        </Link>
        
        <div className="space-y-6 flex-1">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3 px-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors
                ${currentStep > idx ? "bg-primary border-primary text-primary-foreground" : 
                  currentStep === idx ? "border-primary text-primary" : "border-muted text-muted-foreground"}
              `}>
                {idx + 1}
              </div>
              <span className={`font-medium ${currentStep === idx ? "text-foreground" : "text-muted-foreground"}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-auto px-2 pt-8">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 text-muted-foreground hover:text-destructive transition-colors w-full text-left font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-x-hidden">
        <header className="md:hidden flex items-center p-4 border-b">
          <img src="/synergi-logo.png" alt="SYNERGi" className="h-8" />
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {currentStep === 0 && <StepPersonalInfo key="step1" onNext={handleNext} />}
            {currentStep === 1 && <StepEducation key="step2" onNext={handleNext} onBack={handleBack} />}
            {currentStep === 2 && <StepWorkExperience key="step3" onNext={handleNext} onBack={handleBack} />}
            {currentStep === 3 && <StepSkills key="step4" onNext={handleNext} onBack={handleBack} />}
            {currentStep === 4 && <StepResume key="step5" onNext={handleNext} onBack={handleBack} />}
            {currentStep === 5 && <StepUsername key="step6" onNext={handleNext} onBack={handleBack} />}
            {currentStep === 6 && <TalentReviewSubmit key="step7" onBack={handleBack} />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
