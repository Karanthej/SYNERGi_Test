import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Authenticating...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we securely connect your account.</p>
      </div>
      <AuthenticateWithRedirectCallback 
        signUpForceRedirectUrl="/sso-sync" 
        signInForceRedirectUrl="/sso-sync" 
      />
    </div>
  );
}
