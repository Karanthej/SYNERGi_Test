import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { useAuth } from "@clerk/clerk-react";

import type { ReactNode } from "react";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user: backendUser, setUser, logout } = useAuthStore();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    if (isLoaded && isSignedIn && !backendUser && !isVerifying) {
      setIsVerifying(true);
      authService.getMe()
        .then(res => {
          if (mounted && res.success) {
            setUser(res.data);
          }
        })
        .catch(() => {
          if (mounted) logout();
        })
        .finally(() => {
          if (mounted) setIsVerifying(false);
        });
    }
    return () => { mounted = false; };
  }, [isLoaded, isSignedIn, backendUser, isVerifying, setUser, logout]);

  if (!isLoaded || isVerifying) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!backendUser) {
    return null;
  }

  if (!backendUser.isProfileComplete) {
    const isOnboardingRoute = location.pathname.startsWith("/onboarding");
    if (!isOnboardingRoute) {
      if (backendUser.role === "FOUNDER") return <Navigate to="/onboarding/founder" replace />;
      if (backendUser.role === "TALENT") return <Navigate to="/onboarding/talent" replace />;
      return <Navigate to="/onboarding/role" replace />;
    } else {
      if (backendUser.role === "FOUNDER" && !location.pathname.startsWith("/onboarding/founder")) {
        return <Navigate to="/onboarding/founder" replace />;
      }
      if (backendUser.role === "TALENT" && !location.pathname.startsWith("/onboarding/talent")) {
        return <Navigate to="/onboarding/talent" replace />;
      }
      if ((!backendUser.role || backendUser.role === "USER") && location.pathname !== "/onboarding/role") {
        return <Navigate to="/onboarding/role" replace />;
      }
    }
  }

  const isOnboardingRoute = location.pathname.startsWith("/onboarding") || location.pathname === "/create-username";
  const isDashboardRoot = location.pathname === "/dashboard";

  if (backendUser.isProfileComplete && (isOnboardingRoute || isDashboardRoot)) {
    if (backendUser.role === "FOUNDER") {
      return <Navigate to="/founder/dashboard" replace />;
    } else {
      return <Navigate to="/talent/dashboard" replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(backendUser.role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return (
    <>
      {children ? children : <Outlet />}
    </>
  );
}
