import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SSOSync() {
  const navigate = useNavigate();
  const { isLoaded: isAuthLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  const hasAttemptedSync = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const syncWithBackend = async () => {
      if (hasAttemptedSync.current) return;
      
      if (isAuthLoaded && isUserLoaded) {
        if (!isSignedIn || !clerkUser) {
          if (mounted) setError("Authentication failed. Please try again.");
          return;
        }

        hasAttemptedSync.current = true;

        try {
          const token = await getToken();
          
          if (!token) {
            throw new Error("Failed to retrieve authentication token.");
          }

          const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
          if (!primaryEmail) {
            throw new Error("No primary email address found on your account.");
          }

          const fullName = clerkUser.fullName || primaryEmail.split("@")[0];
          const profileImage = clerkUser.imageUrl || null;

          // Call the backend to sync the user.
          // We pass role: "USER" by default. The backend handles linking via email/clerkId natively.
          const response = await authService.syncUser({
            email: primaryEmail,
            fullName: fullName,
            profileImage: profileImage,
            role: "USER"
          }, token);

          if (response.success && mounted) {
            setUser(response.data);
            navigate("/dashboard", { replace: true });
          } else {
            throw new Error(response.message || "Failed to synchronize profile.");
          }
        } catch (err: any) {
          console.error("SSO Sync Error:", err);
          if (mounted) {
            const status = err.response?.status;
            if (status === 502 || status === 503 || status === 504 || !err.response) {
              setError(
                "Cannot connect to the server (Error 502). Please make sure the backend is running on port 1026, then click Retry."
              );
            } else {
              setError(err.response?.data?.message || err.message || "Failed to complete authentication. Please contact support.");
            }
          }
        }
      }
    };

    syncWithBackend();

    return () => {
      mounted = false;
    };
  }, [isAuthLoaded, isUserLoaded, isSignedIn, clerkUser, getToken, navigate, setUser, retryCount]);

  const handleRetry = () => {
    hasAttemptedSync.current = false;
    setError(null);
    setRetryCount((c) => c + 1);
  };

  const handleSignOut = () => {
    signOut().then(() => {
      navigate("/login");
    });
  };

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-card border border-border/50 rounded-xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-3 w-full">
            <Button onClick={handleRetry} className="flex-1">
              Retry
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1">
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Finalizing Login...</h2>
        <p className="text-sm text-muted-foreground">Synchronizing your profile securely.</p>
      </div>
    </div>
  );
}
