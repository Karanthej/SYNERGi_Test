// @ts-nocheck
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";

import { useSignUp, useSignIn } from "@clerk/clerk-react";

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, setUser } = useAuthStore();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();

  const email = location.state?.email;
  const type = location.state?.type || "register"; // "register", "login", or "login_mfa"
  const mfaStrategy = location.state?.strategy; // "totp" or "phone_code"
  const bypass = location.state?.bypass; 
  const bypassSessionId = location.state?.sessionId;

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [activeOTPIndex, setActiveOTPIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [resendDisabled, setResendDisabled] = useState<boolean>(true);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!email && type !== "login_mfa") {
      navigate(type === "login" ? "/login" : "/register");
    }
  }, [email, navigate, type]);
  
  // Auto-bypass if no OTP required (e.g. password only login)
  useEffect(() => {
     if (bypass && bypassSessionId) {
       handleSync(bypassSessionId);
     }
  }, [bypass, bypassSessionId]);

  // Timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cooldownTimer: ReturnType<typeof setTimeout>;
    if (resendDisabled && resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendDisabled, resendCooldown]);

  // Focus Input
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeOTPIndex]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!/^[0-9]*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value.substring(value.length - 1);
    setOtp(newOTP);

    if (value && index < 5) {
      setActiveOTPIndex(index + 1);
    }

    // Auto submit if all filled
    if (newOTP.every(val => val !== "") && value) {
      verifyOtp(newOTP.join(""));
    }
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOTP = [...otp];
      if (otp[index]) {
        newOTP[index] = "";
        setOtp(newOTP);
      } else if (index > 0) {
        newOTP[index - 1] = "";
        setOtp(newOTP);
        setActiveOTPIndex(index - 1);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOTP = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOTP[i] = pastedData[i];
    }
    setOtp(newOTP);
    setActiveOTPIndex(Math.min(pastedData.length, 5));

    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };
  
  const handleSync = async (sessionId: string) => {
    if (setActive) {
      await setActive({ session: sessionId });
    }
    
    // Retrieve a fresh token directly from the specific session to avoid race condition
    // where window.Clerk.session is not fully populated yet
    let clerkToken: string | null = null;
    try {
      const targetSession = window.Clerk?.client?.sessions?.find(s => s.id === sessionId);
      if (targetSession) {
        clerkToken = await targetSession.getToken();
      } else {
        clerkToken = await window.Clerk?.session?.getToken() || null;
      }
    } catch (e) {
      console.error("Failed to retrieve fresh Clerk token for sync:", e);
    }
    
    try {
      const rawRole = location.state?.role || "USER";
      const actualRole = rawRole === "Startup Founder" ? "FOUNDER" : rawRole === "Job Seeker" ? "TALENT" : rawRole;
      
      const response = await authService.syncUser({
        email: email,
        fullName: location.state?.fullName || email, // Ideally pass down fullName
        profileImage: null,
        role: actualRole
      }, clerkToken || undefined);
      if (response.success) {
        setUser(response.data);
        setSuccess(true);
        setTimeout(() => {
          if (type === "login" || type === "login_mfa") {
            navigate("/dashboard");
          } else {
            const rawRole = location.state?.role || "USER";
            const actualRole = rawRole === "Startup Founder" ? "FOUNDER" : rawRole === "Job Seeker" ? "TALENT" : rawRole;
            updateUser({ role: actualRole });
            if (actualRole === "FOUNDER") navigate("/onboarding/founder");
            else if (actualRole === "TALENT") navigate("/onboarding/talent");
            else navigate("/onboarding/role");
          }
        }, 1500);
      } else {
        setError(response.message || "Failed to sync user.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to sync user profile.");
    }
  };

  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setError(null);

    if (type === "password-reset") {
      navigate("/reset-password", { state: { email, otpCode: code } });
      return;
    }

    try {
      if (type === "login" && isSignInLoaded && signIn) {
         const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
         if (result.status === "complete") {
            await handleSync(result.createdSessionId!);
         } else {
            setError("Additional verification required.");
         }
      } else if (type === "login_mfa" && isSignInLoaded && signIn) {
         const result = await signIn.attemptSecondFactor({ strategy: mfaStrategy, code });
         if (result.status === "complete") {
            await handleSync(result.createdSessionId!);
         } else {
            setError("Additional verification required.");
         }
      } else if (type === "register" && isSignUpLoaded && signUp) {
         const result = await signUp.attemptEmailAddressVerification({ code });
         if (result.status === "complete") {
            await handleSync(result.createdSessionId!);
         } else {
            setError("Failed to verify email.");
         }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid or expired verification code.");
      setOtp(Array(6).fill(""));
      setActiveOTPIndex(0);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setResendCooldown(60);
    setTimeLeft(600);
    setError(null);

    try {
      if (type === "login" && isSignInLoaded && signIn) {
         await signIn.prepareFirstFactor({
           strategy: "email_code",
           emailAddressId: signIn.supportedFirstFactors.find(
             (f) => f.strategy === "email_code"
           )?.emailAddressId || "",
         });
      } else if (type === "login_mfa" && mfaStrategy === "phone_code" && isSignInLoaded && signIn) {
         const phoneFactor = signIn.supportedSecondFactors?.find(f => f.strategy === "phone_code");
         if (phoneFactor) {
           await signIn.prepareSecondFactor({ strategy: "phone_code", phoneNumberId: phoneFactor.phoneNumberId });
         }
      } else if (type === "login_mfa" && mfaStrategy === "totp") {
         setError("Cannot resend Authenticator codes.");
         setResendDisabled(false);
         return;
      } else if (type === "password-reset") {
         // Implement password reset resend logic via clerk if needed
      } else if (type === "register" && isSignUpLoaded && signUp) {
         await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Network error. Please try again.");
      setResendDisabled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.every(v => v !== "")) {
      verifyOtp(otp.join(""));
    } else {
      setError("Please enter the complete 6-digit code.");
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2">
        <img src="/synergi-logo.png" alt="SYNERGi" className="h-10 w-auto object-contain" />
      </Link>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-border/50 shadow-xl backdrop-blur-sm glass-card/80">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex items-center justify-center mb-2">
              <img src="/synergi-icon.png" alt="SYNERGi" className="w-16 h-16 object-contain shadow-sm rounded-[14px]" />
            </div>
            <CardTitle className="text-2xl">
              {type === "login" ? "2-Step Verification" : type === "login_mfa" ? "Authenticator Code" : "Verify your email"}
            </CardTitle>
            <CardDescription className="text-base">
              {type === "login_mfa" && mfaStrategy === "totp" ? (
                "Enter the 6-digit code from your authenticator app."
              ) : (
                <>
                  We've sent a 6-digit verification code to<br />
                  <span className="font-medium text-foreground">{email}</span>
                </>
              )}
            </CardDescription>
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
                <h3 className="text-xl font-semibold">
                  {type === "login" || type === "login_mfa" ? "Login Successful!" : "Registration Successful!"}
                </h3>
                <p className="text-white/80 text-sm">{type === "login" || type === "login_mfa" ? "Redirecting to your dashboard..." : "Please login to continue."}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {error && (
                  <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {timeLeft === 0 && !error && (
                  <div className="p-3 rounded bg-amber-500/10 text-amber-500 text-sm font-medium border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Your verification code has expired. Please request a new one.</p>
                  </div>
                )}

                {resendSuccess && (
                  <div className="p-3 rounded bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Verification code resent successfully!</p>
                  </div>
                )}

                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((_, index) => (
                    <Input
                      key={index}
                      ref={index === activeOTPIndex ? inputRef : null}
                      type="text"
                      className="w-12 h-14 text-center text-xl font-semibold sm:w-14 sm:h-16 rounded-xl border-border/60 bg-transparent focus-visible:ring-primary focus-visible:border-primary transition-all"
                      value={otp[index]}
                      onChange={(e) => handleOnChange(e, index)}
                      onKeyDown={(e) => handleOnKeyDown(e, index)}
                      onPaste={handlePaste}
                      disabled={isVerifying || timeLeft === 0}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 text-base font-medium rounded-xl"
                  disabled={isVerifying || timeLeft === 0 || !otp.every(v => v !== "")}
                >
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            )}
          </CardContent>

          {!success && (
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-muted-foreground">Time remaining:</span>
                <span className={`font-medium ${timeLeft < 60 ? "text-destructive" : ""}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="text-sm text-center text-muted-foreground w-full pt-4 border-t border-border/40 space-y-2">
                <div>
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendDisabled}
                    className="text-primary hover:underline font-medium disabled:opacity-50 disabled:hover:no-underline ml-1"
                  >
                    {resendDisabled ? `Resend in ${resendCooldown}s` : "Resend now"}
                  </button>
                </div>
                {type === "register" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="text-primary hover:underline font-medium"
                    >
                      Change email address
                    </button>
                  </div>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
