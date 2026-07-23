import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <AlertCircle className="w-16 h-16 text-primary" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight mb-4 text-white">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-white/80 max-w-md mb-8">Oops! The page you are looking for doesn't exist or has been moved.</p>
      <div className="flex gap-4 justify-center">
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
