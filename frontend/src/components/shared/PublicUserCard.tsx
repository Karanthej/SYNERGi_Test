import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, MapPin } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface PublicUserCardProps {
  user: {
    uuid: string;
    fullName: string;
    username: string;
    role: string;
    profileImage: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    skills: string[];
  };
}

export function PublicUserCard({ user }: PublicUserCardProps) {
  const isFounder = user.role === "FOUNDER";
  
  return (
    <Link 
      to={`/profile/${user.uuid}`}
      className="group rounded-xl border glass-card p-0 flex flex-col overflow-hidden hover:shadow-md transition-all duration-[var(--duration-smooth)] relative h-[380px]"
    >
      {/* Top abstract background */}
      <div className="h-32 bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/20 w-full relative">
        <div className="absolute top-4 left-4 z-10">
          <Badge className={isFounder ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}>
            {isFounder ? "Founder" : "Talent"}
          </Badge>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col relative glass-card">
        <div className="flex justify-between -mt-12 mb-3">
          <Avatar className="h-16 w-16 border-4 border-background bg-muted">
            <AvatarImage src={getImageUrl(user.profileImage)} className="object-cover" />
            <AvatarFallback>
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {user.fullName}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            @{user.username || user.fullName.toLowerCase().replace(/\s+/g, '')}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {user.bio || "This user hasn't added a bio yet."}
        </p>

        <div className="mt-auto space-y-4 pt-4 border-t border-border/50">
          {(user.city || user.country) && (
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{[user.city, user.country].filter(Boolean).join(", ")}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            {user.skills?.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-medium opacity-80">
                {skill}
              </Badge>
            ))}
            {user.skills && user.skills.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-medium opacity-80">
                +{user.skills.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
