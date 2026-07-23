// @ts-nocheck
import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, MapPin, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { settingsService } from "@/services/settingsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function BrowseTalent({ hideHeader = false, roleFilter }: { hideHeader?: boolean; roleFilter?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, sortBy, page, roleFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const userRes = await settingsService.exploreUsers({
        search: debouncedSearch,
        role: roleFilter,
        sortBy: sortBy,
        sortDir: 'desc',
        page,
        size: 12
      });
      
      setItems(userRes.content);
      setTotalPages(userRes.totalPages);
      setTotalElements(userRes.totalElements);

    } catch (error) {
      /* console.error removed */
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <div className="glass-card border-b px-6 py-8 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent z-0 pointer-events-none" />
          <div className="w-full max-w-[1920px] mx-auto relative z-10 flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Search className="w-8 h-8 text-primary"/> Discover Talent
              </h1>
              <p className="text-white/80 mt-2 text-lg">Find the perfect co-founder or team member for your startup.</p>
            </div>
            
            <div className="flex-1 max-w-md w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by name, skills, or role..." 
                className="pl-12 h-12 rounded-full bg-transparent shadow-sm text-base"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2 max-w-[1920px] w-full mx-auto shrink-0">
          <div className="flex-1 max-w-md w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name, skills, or role..." 
              className="pl-12 h-12 rounded-full bg-transparent shadow-sm text-base"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden w-full max-w-[1920px] mx-auto">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground font-medium hidden sm:block">
                {totalElements} people found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-xl border glass-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                {items.map((user, index) => (
                  <Link to={`/founder/profile/${user.uuid}`} key={user.uuid || index} className="group rounded-xl border glass-card p-6 flex flex-col hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                        <AvatarImage src={getImageUrl(user.profileImage)} className="object-cover" />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-white truncate group-hover:text-primary transition-colors">
                          {user.fullName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-[10px] uppercase">{user.role}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/80 line-clamp-2 mb-4 flex-1">
                      {user.bio || "No bio provided."}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                      {(user.city || user.country) && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{user.city}{user.city && user.country ? ', ' : ''}{user.country}</span>
                        </div>
                      )}
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex items-center gap-1 truncate">
                          <Code2 className="w-3.5 h-3.5" />
                          <span className="truncate">{user.skills.length} skills</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 mb-8">
                  <Button 
                    variant="outline" 
                    disabled={page === 0} 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                  </Button>
                  <span className="text-sm font-medium">Page {page + 1} of {totalPages}</span>
                  <Button 
                    variant="outline" 
                    disabled={page >= totalPages - 1} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center border rounded-2xl glass-card border-dashed">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">No people found</h3>
              <p className="text-white/80 max-w-md mx-auto mb-8">We couldn't find anyone matching your search. Try a different keyword.</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Search & Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
