import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight mb-4 text-white">401</h1>
      <h2 className="text-2xl font-semibold mb-2">Unauthorized Access</h2>
      <p className="text-white/80 max-w-md mb-8">You must be logged in to access this page. Please log in and try again.</p>
      <Link to="/login">
        <Button size="lg">Go to Login</Button>
      </Link>
    </div>
  );
}
