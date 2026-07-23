import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Offline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-navigate back once connectivity is restored
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        const prev = sessionStorage.getItem("preOfflinePath");
        window.location.href = prev || "/";
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Probe the backend health endpoint; if it succeeds we're back
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:1026/api/v1';
      await fetch(`${apiBase}/health`, { mode: "no-cors", cache: "no-store" });
      const prev = sessionStorage.getItem("preOfflinePath");
      window.location.href = prev || "/";
    } catch {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 text-center">
      <div
        className={`p-6 rounded-full mb-6 transition-all duration-700 ${
          isOnline
            ? "bg-emerald-500/20 animate-pulse"
            : "bg-destructive/10"
        }`}
      >
        {isOnline ? (
          <Wifi className="w-16 h-16 text-emerald-400" />
        ) : (
          <WifiOff className="w-16 h-16 text-destructive" />
        )}
      </div>

      {isOnline ? (
        <>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">
            Connection Restored!
          </h1>
          <p className="text-white/80 max-w-md mb-8">
            You're back online. Redirecting you back…
          </p>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">
            You are offline
          </h1>
          <p className="text-white/80 max-w-md mb-8">
            It seems the server is unreachable or your internet connection was
            lost. Please check your network settings and try again.
          </p>
          <Button
            size="lg"
            disabled={retrying}
            onClick={handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Checking…" : "Retry Connection"}
          </Button>
        </>
      )}
    </div>
  );
}
