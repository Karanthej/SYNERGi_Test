import { StartupForm } from "@/components/startup/StartupForm";

export default function CreateStartup() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Create a Startup Idea</h2>
        <p className="text-white/80 mt-2">Fill out the details below to bring your idea to life.</p>
      </div>
      <StartupForm />
    </div>
  );
}
