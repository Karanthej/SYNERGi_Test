// @ts-nocheck
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { RootLayout } from "@/components/layout/RootLayout";
import TopLoader from "@/components/ui/TopLoader";

// Auth pages
const Landing = lazy(() => import("@/pages/Landing"));
const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const OTPVerification = lazy(() => import("@/pages/auth/OTPVerification"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const SSOCallback = lazy(() => import("@/pages/auth/SSOCallback"));
const SSOSync = lazy(() => import("@/pages/auth/SSOSync"));
const RoleSelection = lazy(() => import("@/pages/onboarding/RoleSelection"));
const FounderFlow = lazy(() => import("@/pages/onboarding/FounderFlow"));
const TalentFlow = lazy(() => import("@/pages/onboarding/TalentFlow"));
const CreateUsername = lazy(() => import("@/pages/auth/CreateUsername"));

// Error pages
const NotFound = lazy(() => import("@/pages/errors/NotFound"));
const ServerError = lazy(() => import("@/pages/errors/ServerError"));
const Unauthorized = lazy(() => import("@/pages/errors/Unauthorized"));
const Forbidden = lazy(() => import("@/pages/errors/Forbidden"));
const BadRequest = lazy(() => import("@/pages/errors/BadRequest"));
const MethodNotAllowed = lazy(() => import("@/pages/errors/MethodNotAllowed"));
const Conflict = lazy(() => import("@/pages/errors/Conflict"));
const Maintenance = lazy(() => import("@/pages/errors/Maintenance"));
const Offline = lazy(() => import("@/pages/errors/Offline"));

// Shared Workspace pages
const CollaborationSpaces = lazy(() => import("@/pages/shared/CollaborationSpaces"));
const WorkspaceAnnouncements = lazy(() => import("@/pages/shared/WorkspaceAnnouncements"));
const WorkspaceMembers = lazy(() => import("@/pages/shared/WorkspaceMembers"));
const TeamChat = lazy(() => import("@/pages/shared/TeamChat"));
const WorkspaceMeetings = lazy(() => import("@/pages/shared/WorkspaceMeetings"));
const MeetingRoom = lazy(() => import("@/pages/shared/MeetingRoom"));
const WorkspaceHome = lazy(() => import("@/pages/shared/WorkspaceHome"));
const WorkspaceSettings = lazy(() => import("@/pages/shared/WorkspaceSettings"));
const Profile = lazy(() => import("@/pages/shared/Profile"));
const WorkspaceCalls = lazy(() => import("@/pages/workspace/WorkspaceCalls"));

// Shared pages
const UnifiedBrowse = lazy(() => import("@/pages/shared/UnifiedBrowse"));

// Founder pages
const FounderDashboard = lazy(() => import("@/pages/founder/FounderDashboard"));
const MyStartups = lazy(() => import("@/pages/founder/MyStartups"));
const FounderApplications = lazy(() => import("@/pages/founder/FounderApplications"));
const FounderJobOffered = lazy(() => import("@/pages/founder/FounderJobOffered"));
const FounderSettings = lazy(() => import("@/pages/founder/FounderSettings"));
const CreateStartup = lazy(() => import("@/pages/founder/CreateStartup"));
const EditStartup = lazy(() => import("@/pages/founder/EditStartup"));
const ReviewApplication = lazy(() => import("@/pages/founder/ReviewApplication"));

// Talent pages
const TalentDashboard = lazy(() => import("@/pages/talent/TalentDashboard"));
const BrowseStartups = lazy(() => import("@/pages/talent/BrowseStartups"));
const TalentApplications = lazy(() => import("@/pages/talent/TalentApplications"));
const TalentJobOffers = lazy(() => import("@/pages/talent/TalentJobOffers"));
const TalentSettings = lazy(() => import("@/pages/talent/TalentSettings"));
const StartupDetails = lazy(() => import("@/pages/talent/StartupDetails"));
const SavedStartups = lazy(() => import("@/pages/talent/SavedStartups"));
const ApplyToStartup = lazy(() => import("@/pages/talent/ApplyToStartup"));

const VoiceAnalyticsPage = lazy(() => import("@/pages/workspace/VoiceAnalyticsPage"));

const withSuspense = (Component: any) => (
  <Suspense fallback={<TopLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: withSuspense(ServerError),
    children: [
      // Public routes
      { path: "/", element: withSuspense(Landing) },
      { path: "/login", element: withSuspense(AuthPage) },
      { path: "/register", element: withSuspense(AuthPage) },
      { path: "/forgot-password", element: withSuspense(ForgotPassword) },
      { path: "/otp-verification", element: withSuspense(OTPVerification) },
      { path: "/reset-password", element: withSuspense(ResetPassword) },
      { path: "/sso-callback", element: withSuspense(SSOCallback) },
      { path: "/sso-sync", element: withSuspense(SSOSync) },
      { path: "/create-username", element: <ProtectedRoute>{withSuspense(CreateUsername)}</ProtectedRoute> },
      {
        path: "/onboarding",
        element: <ProtectedRoute />,
        children: [
          { path: "role", element: withSuspense(RoleSelection) },
          { path: "founder", element: withSuspense(FounderFlow) },
          { path: "talent", element: withSuspense(TalentFlow) },
        ]
      },

      // Dashboard redirect
      {
        path: "/dashboard",
        element: <ProtectedRoute />
      },

      // Founder Routes
      {
        path: "/founder",
        element: <ProtectedRoute allowedRoles={["FOUNDER"]} />,
        children: [
          {
            element: <DashboardLayout><Outlet /></DashboardLayout>,
            children: [
              { path: "dashboard", element: withSuspense(FounderDashboard) },
              { path: "browse", element: withSuspense(UnifiedBrowse) },
              { path: "startups", element: withSuspense(MyStartups) },
              { path: "startups/create", element: withSuspense(CreateStartup) },
              { path: "startups/:id/edit", element: withSuspense(EditStartup) },
              { path: "job-offers", element: withSuspense(FounderJobOffered) },
              { path: "applications", element: withSuspense(FounderApplications) },
              { path: "applications/:id", element: withSuspense(ReviewApplication) },
              { path: "collaboration", element: withSuspense(CollaborationSpaces) },
              { path: "profile", element: withSuspense(Profile) },
              { path: "profile/:id", element: withSuspense(Profile) },
              { path: "settings", element: withSuspense(FounderSettings) },
              { path: "", element: <Navigate to="/founder/dashboard" replace /> },
            ]
          },
          {
            path: "workspace/:id",
            element: withSuspense(WorkspaceLayout),
            children: [
              { path: "", element: withSuspense(WorkspaceHome) },
              { path: "members", element: withSuspense(WorkspaceMembers) },
              { path: "chat", element: withSuspense(TeamChat) },
              { path: "chat/:roomId", element: withSuspense(TeamChat) },
              { path: "meetings", element: withSuspense(WorkspaceMeetings) },
              { path: "meetings/room/:meetingUuid", element: withSuspense(MeetingRoom) },
              { path: "calls", element: withSuspense(WorkspaceCalls) },
              { path: "analytics", element: withSuspense(VoiceAnalyticsPage) },
              { path: "announcements", element: withSuspense(WorkspaceAnnouncements) },
              { path: "settings", element: withSuspense(WorkspaceSettings) },
            ]
          }
        ]
      },

      // Talent Routes
      {
        path: "/talent",
        element: <ProtectedRoute allowedRoles={["TALENT"]} />,
        children: [
          {
            element: <DashboardLayout><Outlet /></DashboardLayout>,
            children: [
              { path: "dashboard", element: withSuspense(TalentDashboard) },
              { path: "browse", element: withSuspense(UnifiedBrowse) },
              { path: "startups/:id", element: withSuspense(StartupDetails) },
              { path: "startups/:id/apply", element: withSuspense(ApplyToStartup) },
              { path: "bookmarks", element: withSuspense(SavedStartups) },
              { path: "job-offers", element: withSuspense(TalentJobOffers) },
              { path: "applications", element: withSuspense(TalentApplications) },
              { path: "collaboration", element: withSuspense(CollaborationSpaces) },
              { path: "profile", element: withSuspense(Profile) },
              { path: "profile/:id", element: withSuspense(Profile) },
              { path: "settings", element: withSuspense(TalentSettings) },
              { path: "", element: <Navigate to="/talent/dashboard" replace /> },
            ]
          },
          {
            path: "workspace/:id",
            element: withSuspense(WorkspaceLayout),
            children: [
              { path: "", element: withSuspense(WorkspaceHome) },
              { path: "members", element: withSuspense(WorkspaceMembers) },
              { path: "chat", element: withSuspense(TeamChat) },
              { path: "chat/:roomId", element: withSuspense(TeamChat) },
              { path: "meetings", element: withSuspense(WorkspaceMeetings) },
              { path: "meetings/room/:meetingUuid", element: withSuspense(MeetingRoom) },
              { path: "calls", element: withSuspense(WorkspaceCalls) },
              { path: "announcements", element: withSuspense(WorkspaceAnnouncements) },
              { path: "settings", element: withSuspense(WorkspaceSettings) },
            ]
          }
        ]
      },

      // Error pages
      { path: "/400", element: withSuspense(BadRequest) },
      { path: "/401", element: withSuspense(Unauthorized) },
      { path: "/403", element: withSuspense(Forbidden) },
      { path: "/404", element: withSuspense(NotFound) },
      { path: "/405", element: withSuspense(MethodNotAllowed) },
      { path: "/409", element: withSuspense(Conflict) },
      { path: "/500", element: withSuspense(ServerError) },
      { path: "/maintenance", element: withSuspense(Maintenance) },
      { path: "/offline", element: withSuspense(Offline) },
      { path: "*", element: withSuspense(NotFound) },
    ]
  }
]);
