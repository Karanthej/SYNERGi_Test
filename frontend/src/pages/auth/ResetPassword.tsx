// @ts-nocheck
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "1 uppercase letter")
    .regex(/[a-z]/, "1 lowercase letter")
    .regex(/[0-9]/, "1 number")
    .regex(/[@$!%*#?&]/, "1 special character (@$!%*#?&)"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

import { useSignIn } from "@clerk/clerk-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, signIn, setActive } = useSignIn();
  
  const email = location.state?.email;
  const otpCode = location.state?.otpCode;

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (!email || !otpCode) {
      navigate("/forgot-password");
    }
  }, [email, otpCode, navigate]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange"
  });

  const watchPassword = watch("password", "");

  const getPasswordStrength = () => {
    let score = 0;
    if (!watchPassword) return { score: 0, label: "", color: "bg-muted" };
    if (watchPassword.length >= 8) score++;
    if (/[A-Z]/.test(watchPassword)) score++;
    if (/[a-z]/.test(watchPassword)) score++;
    if (/[0-9]/.test(watchPassword)) score++;
    if (/[@$!%*#?&]/.test(watchPassword)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-destructive" };
    if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength();

  const onSubmit = async (data: ResetPasswordValues) => {
    setServerError("");
    if (!isLoaded) return;
    
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: otpCode,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Password reset successfully");
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setServerError("Failed to reset password.");
      }
    } catch (error: any) {
      setServerError(error.errors?.[0]?.message || "Failed to reset password. Please try again.");
    }
  };

  if (!email || !otpCode) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2">
        <img src="/synergi-logo.png" alt="SYNERGI" className="h-10 w-auto object-contain" />
      </Link>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-border/50 shadow-xl backdrop-blur-sm glass-card/80">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>Please enter your new strong password below.</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Password Reset Successful!</h3>
                <p className="text-white/80 text-sm">You can now login with your new password. Redirecting to login...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <p>{serverError}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
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
                  
                  {watchPassword.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium text-right">{strength.label}</p>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      {...register("confirmPassword")}
                      className={`${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
