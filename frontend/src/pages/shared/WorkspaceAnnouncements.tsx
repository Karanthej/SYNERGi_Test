import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { announcementService } from '@/services/announcementService';
import type { Announcement, AnnouncementRequest } from '@/types/announcement';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '@/lib/utils';
import { Megaphone, Pin, Trash2, Plus, AlertCircle, Info, Flame, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function WorkspaceAnnouncements() {
  const { workspace } = useOutletContext<{ workspace: any }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [isPinned, setIsPinned] = useState(false);

  const isOwner = workspace.userRole === 'OWNER';

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementService.getAnnouncements(workspace.startupUuid);
      setAnnouncements(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error fetching announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [workspace.startupUuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsSubmitting(true);
      const data: AnnouncementRequest = { title, content, priority, isPinned };
      await announcementService.createAnnouncement(workspace.startupUuid, data);
      
      // If pinned, insert after existing pins or at top. Easy way is refetch or manual sort.
      // Easiest is to just refetch.
      await fetchAnnouncements();
      
      setIsDialogOpen(false);
      resetForm();
      toast.success("Announcement posted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('NORMAL');
    setIsPinned(false);
  };

  const handleDelete = async (announcementUuid: string) => {
    try {
      await announcementService.deleteAnnouncement(workspace.startupUuid, announcementUuid);
      setAnnouncements(prev => prev.filter(a => a.uuid !== announcementUuid));
      toast.success("Announcement deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete announcement");
    }
  };

  const handleTogglePin = async (announcementUuid: string, currentPinStatus: boolean) => {
    try {
      await announcementService.togglePin(workspace.startupUuid, announcementUuid, !currentPinStatus);
      await fetchAnnouncements(); // Refresh to get proper sorting
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update pin status");
    }
  };

  const getPriorityConfig = (pri: string) => {
    switch (pri) {
      case 'HIGH': return { color: 'bg-red-500/10 text-red-600 border-red-200', icon: Flame };
      case 'NORMAL': return { color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Info };
      case 'LOW': return { color: 'glass-surface0/10 text-muted-foreground border-[var(--glass-border)]', icon: AlertCircle };
      default: return { color: 'glass-surface0/10 text-muted-foreground border-[var(--glass-border)]', icon: Info };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Announcements</h1>
          <p className="text-white/80">Broadcast important updates to your team.</p>
        </div>

        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>
                    This will be visible to all members in the workspace.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      placeholder="E.g., Q3 Goals and Milestones" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">Message</Label>
                    <Textarea 
                      id="content" 
                      placeholder="What's the update?"
                      className="min-h-[120px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col justify-center space-y-2 pt-6">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="pin" 
                          checked={isPinned}
                          onCheckedChange={setIsPinned}
                        />
                        <Label htmlFor="pin" className="cursor-pointer">Pin to top</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
                    {isSubmitting ? "Posting..." : "Post Announcement"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="glass-card border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No announcements yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm text-center">
            {isOwner 
              ? "Create your first announcement to keep your team in the loop." 
              : "When the workspace owner posts an update, it will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const priorityConfig = getPriorityConfig(announcement.priority);
            const PriorityIcon = priorityConfig.icon;
            
            return (
              <div 
                key={announcement.uuid} 
                className={`glass-card rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${announcement.isPinned ? 'border-primary/30 shadow-primary/5' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={getImageUrl(announcement.authorAvatar) || ''} />
                      <AvatarFallback>{announcement.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{announcement.authorName}</h4>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground uppercase font-medium tracking-wider">
                          {announcement.authorRole.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {announcement.isPinned && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-2">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    <Badge variant="outline" className={`gap-1.5 px-2 ${priorityConfig.color}`}>
                      <PriorityIcon className="h-3 w-3" /> {announcement.priority}
                    </Badge>

                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePin(announcement.uuid, announcement.isPinned)}>
                            <Pin className="h-4 w-4 mr-2" />
                            {announcement.isPinned ? "Unpin" : "Pin to top"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(announcement.uuid)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <div className="pl-[52px]">
                  <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
