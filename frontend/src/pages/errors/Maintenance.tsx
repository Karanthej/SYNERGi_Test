import { Settings2 } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <Settings2 className="w-16 h-16 text-primary animate-spin-slow" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Under Maintenance</h1>
      <p className="text-white/80 max-w-md mb-8">We are currently performing scheduled maintenance to improve the platform. We'll be back online shortly.</p>
    </div>
  );
}
