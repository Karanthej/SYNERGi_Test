// @ts-nocheck
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignIn } from "@clerk/clerk-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isLoaded, signIn } = useSignIn();
  const [serverError, setServerError] = useState("");
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setServerError("");
    if (!isLoaded) return;
    
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });
      navigate("/otp-verification", { state: { email: data.email, type: "password-reset" } });
    } catch (error: any) {
      setServerError(error.errors?.[0]?.message || "Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2">
        <img src="/synergi-logo.png" alt="SYNERGI" className="h-10 w-auto object-contain" />
      </Link>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-border/50 shadow-xl backdrop-blur-sm glass-card/80">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a reset OTP</CardDescription>
          </CardHeader>
          <CardContent>
            {serverError && (
              <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <p>{serverError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2 text-left">
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
              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">Back to Login</Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
