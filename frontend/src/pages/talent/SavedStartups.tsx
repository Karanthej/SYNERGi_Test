import { useEffect, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { talentStartupService } from "@/services/talentStartupService";
import type { ExploreStartupResponse, PageResponse } from "@/services/talentStartupService";
import { PublicStartupCard } from "@/components/startup/PublicStartupCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function SavedStartups() {
  const [data, setData] = useState<PageResponse<ExploreStartupResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchBookmarks();
  }, [page]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await talentStartupService.getBookmarkedStartups(page, 12);
      setData(res);
    } catch (error) {
      /* console.error removed */
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = (uuid: string, isBookmarked: boolean) => {
    if (!isBookmarked && data) {
      // If unbookmarked from this page, remove it from list
      setData({
        ...data,
        content: data.content.filter(s => s.uuid !== uuid),
        totalElements: data.totalElements - 1
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white"><Bookmark className="w-8 h-8 text-primary" /> Saved Startups</h2>
          <p className="text-white/80 mt-2">Startups you have bookmarked for later review or to apply to.</p>
        </div>
        <Link to="/talent/startups">
          <Button variant="outline">
            Discover More
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border glass-card p-0 flex flex-col overflow-hidden min-h-[380px] h-auto">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-5 flex-1 flex flex-col gap-3">
                <Skeleton className="h-16 w-16 rounded-xl -mt-12 mb-2 border-4 border-background bg-muted" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="mt-auto space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.content.length ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.content.map(startup => (
              <PublicStartupCard 
                key={startup.uuid} 
                startup={startup} 
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
              <Button 
                variant="outline" 
                disabled={page === 0} 
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <span className="text-sm font-medium">Page {page + 1} of {data.totalPages}</span>
              <Button 
                variant="outline" 
                disabled={page >= data.totalPages - 1} 
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl glass-card border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">No saved startups yet</h3>
          <p className="text-white/80 max-w-md mx-auto mb-8">You haven't bookmarked any startup ideas yet. Start exploring and save the ones that catch your eye!</p>
          <Link to="/talent/startups">
            <Button>Explore Ideas</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
