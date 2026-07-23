// @ts-nocheck
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle, Eye, EyeOff } from "lucide-react";
import SocialAuthButtons from "./SocialAuthButtons";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/authService";

import { useSignIn } from "@clerk/clerk-react";
import { useAuthStore } from "@/store/useAuthStore";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchMode: () => void;
}

export default function LoginForm({ onSwitchMode }: LoginFormProps) {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError("");
    
    if (!isLoaded) return;
    
    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "needs_first_factor") {
         // Check if email_code is a supported strategy before trying it
         const emailCodeFactor = result.supportedFirstFactors?.find(
           (f: any) => f.strategy === "email_code"
         );
         if (emailCodeFactor?.emailAddressId) {
           await signIn.prepareFirstFactor({
             strategy: "email_code",
             emailAddressId: emailCodeFactor.emailAddressId,
           });
           navigate("/otp-verification", { state: { email: data.email, type: "login" } });
         } else {
           // Password-based accounts should not hit needs_first_factor.
           // This can happen if the account was created via OAuth (Google/Apple/Facebook).
           // Supported strategies: show them to help debug.
           const strategies = result.supportedFirstFactors?.map((f: any) => f.strategy).join(", ") || "none";
           setServerError(
             `This account cannot sign in with a password. It was created using a social login (${strategies}). Please use the social login buttons below.`
           );
         }
      } else if (result.status === "complete") {
         if (setActive) {
           await setActive({ session: result.createdSessionId });
         }
         
         let clerkToken: string | null = null;
         try {
           const targetSession = window.Clerk?.client?.sessions?.find(s => s.id === result.createdSessionId);
           if (targetSession) {
             clerkToken = await targetSession.getToken();
           } else {
             clerkToken = await window.Clerk?.session?.getToken() || null;
           }
         } catch (e) {
           console.error("Failed to retrieve fresh Clerk token for sync:", e);
         }
         
         try {
           const response = await authService.syncUser({
             email: data.email,
             fullName: data.email, // Best fallback
             profileImage: null,
             role: "USER"
           }, clerkToken || undefined);
           
           if (response.success) {
             useAuthStore.getState().setUser(response.data);
             navigate("/dashboard");
           } else {
             setServerError(response.message || "Failed to sync user.");
           }
         } catch(err: any) {
            setServerError(err.response?.data?.message || err.message || "Failed to sync user profile.");
         }
      } else {
         console.log("Unhandled Clerk Status:", result);
         if (result.status === "needs_second_factor") {
           const totpFactor = result.supportedSecondFactors?.find((f: any) => f.strategy === "totp");
           const phoneFactor = result.supportedSecondFactors?.find((f: any) => f.strategy === "phone_code");
           
           const strategy = totpFactor ? "totp" : phoneFactor ? "phone_code" : null;
           
           if (strategy) {
             navigate("/otp-verification", { state: { email: data.email, type: "login_mfa", strategy } });
           } else {
             setServerError("Multi-Factor Authentication is required but no supported methods were found on this account.");
           }
         } else {
           setServerError(`Unexpected login status: ${result.status}. Please check Clerk configuration.`);
         }
      }
    } catch (error: any) {
      if (error.errors?.[0]?.code === "session_exists") {
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        setServerError("Stale session cleared. Please click Login again.");
      } else {
        setServerError(error.errors?.[0]?.message || "Invalid email or password.");
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm">
          Enter your email and password to login to your account
        </p>
      </div>
      
      {serverError && (
        <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@example.com" 
            {...register("email")}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              {...register("password")}
              className={`${errors.password ? "border-destructive focus-visible:ring-destructive" : ""} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Verifying Credentials..." : "Login"}
        </Button>
      </form>

      <SocialAuthButtons mode="login" />
      
      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchMode} className="text-primary font-medium hover:underline focus:outline-none">
          Sign up
        </button>
      </div>
    </div>
  );
}
