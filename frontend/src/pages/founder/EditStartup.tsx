import { StartupForm } from "@/components/startup/StartupForm";
import { useParams } from "react-router-dom";

export default function EditStartup() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Edit Startup</h2>
        <p className="text-white/80 mt-2">Update the details of your startup.</p>
      </div>
      <StartupForm startupId={id} />
    </div>
  );
}
