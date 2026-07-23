import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Education = {
  id: string;
  highestQualification: string;
  university: string;
  branch: string;
  graduationYear: string;
  cgpa: string;
};

export type WorkExperience = {
  id: string;
  companyName: string;
  role: string;
  years: string;
  responsibilities: string;
  currentCompany: boolean;
};

export type StartupIdea = {
  id: string;
  name: string;
  logo: string;
  shortDescription: string;
  fullDescription: string;
  problemStatement: string;
  solution: string;
  industry: string;
  targetUsers: string;
  stage: string;
  requiredSkills: string[];
  hiringProcess: string;
  location: string;
  workType: string;
  openPositions: string;
  deadline: string;
};

interface OnboardingState {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    dob: string;
    gender: string;
    country: string;
    state: string;
    city: string;
    linkedin: string;
    portfolio: string;
    profilePhoto: string;
  };
  education: Education[];
  hasWorkExperience: boolean | null;
  workExperience: WorkExperience[];
  startupIdeas: StartupIdea[];
  skills: string[];
  resume: {
    cv: string;
    portfolioDoc: string;
    github: string;
    linkedin: string;
    portfolio: string;
  };
  setPersonalInfo: (info: Partial<OnboardingState['personalInfo']>) => void;
  setEducation: (education: Education[]) => void;
  setHasWorkExperience: (has: boolean) => void;
  setWorkExperience: (exp: WorkExperience[]) => void;
  setStartupIdeas: (ideas: StartupIdea[]) => void;
  setSkills: (skills: string[]) => void;
  setResume: (resume: Partial<OnboardingState['resume']>) => void;
  resetStore: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        country: '',
        state: '',
        city: '',
        linkedin: '',
        portfolio: '',
        profilePhoto: '',
      },
      education: [],
      hasWorkExperience: null,
      workExperience: [],
      startupIdeas: [
        {
          id: "startup-12345",
          name: "Nexus AI",
          logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Nexus",
          shortDescription: "Automating customer support with empathetic AI agents.",
          fullDescription: "Nexus AI is building the next generation of conversational agents that understand nuance and emotion, providing human-like support at scale.",
          problemStatement: "Customer support is expensive and often frustrating for users who have to wait hours for simple resolutions.",
          solution: "An LLM-powered support agent that resolves 80% of tier 1 support tickets instantly with high customer satisfaction.",
          industry: "Artificial Intelligence / SaaS",
          targetUsers: "Mid-to-large e-commerce and SaaS companies.",
          stage: "Seed",
          requiredSkills: ["React", "Python", "Machine Learning", "Prompt Engineering"],
          hiringProcess: "Initial Screen -> Technical Interview -> Founder Chat",
          location: "San Francisco, CA (or Remote)",
          workType: "Hybrid",
          openPositions: "3",
          deadline: "2026-08-01",
        }
      ],
      skills: [],
      resume: {
        cv: '',
        portfolioDoc: '',
        github: '',
        linkedin: '',
        portfolio: '',
      },
      setPersonalInfo: (info) =>
        set((state) => ({ personalInfo: { ...state.personalInfo, ...info } })),
      setEducation: (education) => set({ education }),
      setHasWorkExperience: (hasWorkExperience) => set({ hasWorkExperience }),
      setWorkExperience: (workExperience) => set({ workExperience }),
      setStartupIdeas: (startupIdeas) => set({ startupIdeas }),
      setSkills: (skills) => set({ skills }),
      setResume: (resume) =>
        set((state) => ({ resume: { ...state.resume, ...resume } })),
      resetStore: () => set({
        personalInfo: { fullName: '', email: '', phone: '', dob: '', gender: '', country: '', state: '', city: '', linkedin: '', portfolio: '', profilePhoto: '' },
        education: [],
        hasWorkExperience: null,
        workExperience: [],
        startupIdeas: [],
        skills: [],
        resume: { cv: '', portfolioDoc: '', github: '', linkedin: '', portfolio: '' }
      })
    }),
    {
      name: 'onboarding-storage',
      version: 2,
    }
  )
);
