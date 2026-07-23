import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient as api } from "@/lib/apiClient";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function StepUsername({ onNext, onBack }: Props) {
  const { user, updateUser } = useAuthStore();
  
  const [username, setUsername] = useState(user?.username || "");
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(user?.username ? true : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already has username, we don't need to re-validate it
  const isAlreadySet = !!user?.username;

  useEffect(() => {
    if (isAlreadySet) return;
    
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
  }, [username, isAlreadySet]);

  const handleNext = async () => {
    if (isAlreadySet) {
      onNext();
      return;
    }

    if (!isAvailable || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      await api.post("/users/set-username", { username: cleanUsername });
      
      updateUser({ username: cleanUsername });
      toast.success("Username saved successfully!");
      onNext();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to set username");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold">Choose a Username</h2>
        <p className="text-muted-foreground">This will be your permanent public identity across SYNERGI. You cannot change this later.</p>
      </div>

      <div className="space-y-6 max-w-md">
        <div>
          <Label htmlFor="username" className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground">
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
              disabled={isAlreadySet}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {!isAlreadySet && isValidating ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : isAvailable === true ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isAvailable === false && username ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            {isAlreadySet ? (
              <p className="mt-2 text-green-600 font-medium">Your username is permanently set.</p>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={handleNext} 
          disabled={(!isAlreadySet && (!isAvailable || isSubmitting || isValidating))}
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            "Next Step"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
