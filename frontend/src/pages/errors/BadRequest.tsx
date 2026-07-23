import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function BadRequest() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight mb-4 text-white">400</h1>
      <h2 className="text-2xl font-semibold mb-2">Bad Request</h2>
      <p className="text-white/80 max-w-md mb-8">We couldn't process your request because the data provided was invalid or malformed.</p>
      <div className="flex gap-4">
        <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Link to="/">
          <Button size="lg">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
