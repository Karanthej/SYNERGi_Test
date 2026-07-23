// @ts-nocheck
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle, Eye, EyeOff } from "lucide-react";
import SocialAuthButtons from "./SocialAuthButtons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { authService } from "@/services/authService";
import { useSignUp } from "@clerk/clerk-react";

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "1 uppercase letter")
    .regex(/[a-z]/, "1 lowercase letter")
    .regex(/[0-9]/, "1 number")
    .regex(/[@$!%*#?&]/, "1 special character (@$!%*#?&)"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept terms",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchMode: () => void;
}

export default function RegisterForm({ onSwitchMode }: RegisterFormProps) {
  const navigate = useNavigate();
  const { setPersonalInfo } = useOnboardingStore();
  const { isLoaded, signUp } = useSignUp();
  
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
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

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError("");
    
    if (!isLoaded) return;
    
    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.fullName.split(" ")[0],
        lastName: data.fullName.split(" ").slice(1).join(" ")
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      
      setPersonalInfo({ fullName: data.fullName, email: data.email });
      navigate("/otp-verification", { state: { email: data.email, fullName: data.fullName, type: "register" } });
    } catch (error: any) {
      if (error.errors?.[0]?.code === "session_exists") {
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        setServerError("Stale session cleared. Please click Sign Up again.");
      } else {
        setServerError(error.errors?.[0]?.message || "Failed to create account.");
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
        <p className="text-muted-foreground text-sm">Join SYNERGi today</p>
      </div>
      
      {serverError && (
        <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" placeholder="John Doe" {...register("fullName")} className={errors.fullName ? "border-destructive" : ""} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" placeholder="name@example.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="reg-password">Password</Label>
          <div className="relative">
            <Input 
              id="reg-password" 
              type={showPassword ? "text" : "password"} 
              {...register("password")} 
              className={`${errors.password ? "border-destructive" : ""} pr-10`} 
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
            <div className="space-y-1 mt-1">
              <div className="flex h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
              </div>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              {...register("confirmPassword")} 
              className={`${errors.confirmPassword ? "border-destructive" : ""} pr-10`} 
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
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <Checkbox id="acceptTerms" onCheckedChange={(checked) => setValue("acceptTerms", checked === true, { shouldValidate: true })} />
          <Label htmlFor="acceptTerms" className="text-xs font-normal text-muted-foreground">
            I accept the <span className="text-primary hover:underline cursor-pointer">Terms & Conditions</span>
          </Label>
        </div>
        {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>}

        <div id="clerk-captcha" />
        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
      
      <SocialAuthButtons mode="register" />

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchMode} className="text-primary font-medium hover:underline focus:outline-none">
          Log in
        </button>
      </div>
    </div>
  );
}
