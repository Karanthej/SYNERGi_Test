import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient as api } from "@/lib/apiClient";

export default function CreateUsername() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [username, setUsername] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce API check
  useEffect(() => {
    if (!username) {
      setIsAvailable(null);
      setIsValidating(false);
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{4,20}$/;

    if (!usernameRegex.test(cleanUsername)) {
      setIsAvailable(false);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get(`/users/check-username?username=${cleanUsername}`);
        setIsAvailable(response.data.available);
      } catch {
        setIsAvailable(false);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const response = await api.post("/users/set-username", { username: cleanUsername });
      
      updateUser({ username: cleanUsername });
      toast.success(response.data.message || "Username created successfully!");
      
      // Redirect to dashboard based on role
      if (user?.role === "FOUNDER") {
        navigate("/founder/dashboard", { replace: true });
      } else {
        navigate("/talent/dashboard", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to set username");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  // If user already has a username, redirect away
  if (user.username) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center glass-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl glass-surface p-10 shadow-lg">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Create Your Username</h2>
          <p className="text-white/80">
            This will be your permanent public identity across SYNERGI. You cannot change this later.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-muted-foreground">
              Username
            </Label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                type="text"
                required
                className="pl-8"
                placeholder="john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isValidating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : isAvailable === true ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isAvailable === false && username ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li className={username.length >= 4 && username.length <= 20 ? "text-green-600" : ""}>4-20 characters long</li>
                <li className={/^[a-z0-9_]+$/.test(username) ? "text-green-600" : ""}>Only lowercase letters, numbers, and underscores</li>
              </ul>
              {isAvailable === false && username && !isValidating && (
                <p className="mt-2 text-red-600 font-medium">❌ Username is unavailable or invalid.</p>
              )}
              {isAvailable === true && (
                <p className="mt-2 text-green-600 font-medium">✅ Username is available!</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isAvailable || isSubmitting || isValidating}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting Username...
              </>
            ) : (
              "Confirm Username"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
