import { cn } from "@/lib/utils";

// ── Base Skeleton ──────────────────────────────────────────────────────────────
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        "bg-white/10 dark:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

// ── Stat Card Skeleton (Dashboard) ────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

// ── Dashboard Skeleton (4-up stats + recent activity) ────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="p-0 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Startup Card Skeleton ─────────────────────────────────────────────────────
export function StartupCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Description */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ── Browse Grid Skeleton (mixed startups + users) ─────────────────────────────
export function BrowseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <StartupCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── User Card Skeleton ────────────────────────────────────────────────────────
export function UserCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

// ── Application Row Skeleton ──────────────────────────────────────────────────
export function ApplicationRowSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  );
}

// ── Applications List Skeleton ────────────────────────────────────────────────
export function ApplicationsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <ApplicationRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Profile Skeleton ──────────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Cover image */}
      <Skeleton className="w-full h-48 rounded-2xl" />
      {/* Avatar + name */}
      <div className="px-6 -mt-16 flex items-end gap-4">
        <Skeleton className="h-28 w-28 rounded-full border-4 border-background shrink-0" />
        <div className="mb-2 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      {/* Content sections */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <div className="glass-card p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Startup Detail Skeleton ───────────────────────────────────────────────────
export function StartupDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="glass-card p-8 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {/* Body sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat Message Skeleton ─────────────────────────────────────────────────────
export function ChatMessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  const isRight = align === "right";
  return (
    <div className={cn("flex items-end gap-2 px-4", isRight && "flex-row-reverse")}>
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className={cn("space-y-1", isRight && "items-end")}>
        <Skeleton className={cn("h-10 rounded-2xl", isRight ? "w-48 rounded-br-sm" : "w-64 rounded-bl-sm")} />
        <Skeleton className="h-3 w-16 mx-1" />
      </div>
    </div>
  );
}

// ── Chat Panel Skeleton ───────────────────────────────────────────────────────
export function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 space-y-4 p-4 overflow-hidden animate-in fade-in duration-300">
        <ChatMessageSkeleton align="left" />
        <ChatMessageSkeleton align="right" />
        <ChatMessageSkeleton align="left" />
        <ChatMessageSkeleton align="left" />
        <ChatMessageSkeleton align="right" />
        <ChatMessageSkeleton align="left" />
      </div>
      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Workspace Home Skeleton ───────────────────────────────────────────────────
export function WorkspaceHomeSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-80" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      {/* Members */}
      <div className="glass-card p-5 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>
      {/* Recent announcements */}
      <div className="glass-card p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page Skeleton (route-level Suspense fallback) ─────────────────────────────
// Replaces the raw spinner — shows the layout shell immediately then fades in content skeleton
export function PageSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Page header area */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-96 max-w-full" />
      </div>
      {/* Content grid placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-18 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Saved Startups Skeleton ───────────────────────────────────────────────────
export function SavedStartupsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <StartupCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Members List Skeleton ─────────────────────────────────────────────────────
export function MembersListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
