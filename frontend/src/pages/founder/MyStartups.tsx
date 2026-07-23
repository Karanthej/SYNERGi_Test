import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Rocket, AlertCircle } from "lucide-react";
import { StartupCard } from "@/components/startup/StartupCard";
import type { StartupResponse } from "@/components/startup/StartupCard";
import { startupService } from "@/services/myStartupService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyStartups() {
  const [startups, setStartups] = useState<StartupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const data = await startupService.getMyStartups();
      setStartups(data);
    } catch (error) {
      toast.error("Failed to fetch startups");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await startupService.deleteStartup(deleteId);
      toast.success("Startup deleted successfully");
      setStartups(startups.filter(s => s.uuid !== deleteId));
    } catch (error) {
      toast.error("Failed to delete startup");
    } finally {
      setDeleteId(null);
    }
  };

  const handleArchive = async (uuid: string) => {
    try {
      await startupService.updateStatus(uuid, 'ARCHIVED');
      toast.success("Startup archived");
      fetchStartups();
    } catch (error) {
      toast.error("Failed to archive startup");
    }
  };

  const handlePublish = async (uuid: string) => {
    try {
      await startupService.updateStatus(uuid, 'PUBLISHED');
      toast.success("Startup published successfully!");
      fetchStartups();
    } catch (error) {
      toast.error("Failed to publish startup");
    }
  };

  const filteredStartups = startups
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.tagline?.toLowerCase().includes(search.toLowerCase()))
    .filter(s => statusFilter === "ALL" || s.status === statusFilter)
    .filter(s => stageFilter === "ALL" || s.stage === stageFilter)
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="p-0 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Startups</h2>
          <p className="text-white/80 mt-2">Manage your startup ideas and workspaces.</p>
        </div>
        <Link to="/founder/startups/create">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Create Startup
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 glass-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search startups..." 
            className="pl-9 bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-transparent shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Drafts</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[140px] bg-transparent shrink-0">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              <SelectItem value="IDEA">Idea</SelectItem>
              <SelectItem value="PROTOTYPE">Prototype</SelectItem>
              <SelectItem value="MVP">MVP</SelectItem>
              <SelectItem value="EARLY_TRACTION">Early Traction</SelectItem>
              <SelectItem value="GROWTH">Growth</SelectItem>
              <SelectItem value="SCALING">Scaling</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-transparent shrink-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Recently Updated</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border glass-card p-0 flex flex-col overflow-hidden min-h-[340px] h-auto">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-5 flex-1 flex flex-col gap-3">
                <Skeleton className="h-16 w-16 rounded-xl -mt-12 mb-2 border-4 border-background bg-muted" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="mt-auto flex gap-2 pt-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredStartups.length > 0 ? (
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStartups.map(startup => (
            <StartupCard 
              key={startup.uuid} 
              startup={startup} 
              onDelete={setDeleteId}
              onArchive={handleArchive}
              onPublish={handlePublish}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl glass-card border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">No startups found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            {search || statusFilter !== 'ALL' || stageFilter !== 'ALL' 
              ? "We couldn't find any startups matching your current filters."
              : "You haven't created any startups yet. Start building your next big idea today!"}
          </p>
          <div className="flex gap-4">
            {(search || statusFilter !== 'ALL' || stageFilter !== 'ALL') ? (
              <Button variant="outline" onClick={() => {
                setSearch(""); setStatusFilter("ALL"); setStageFilter("ALL");
              }}>
                Clear Filters
              </Button>
            ) : (
              <Link to="/founder/startups/create">
                <Button><Plus className="w-4 h-4 mr-2" /> Create Your First Startup</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this startup? This action will remove it from your dashboard.
              (If published, it will be removed from the public directory).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Startup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
