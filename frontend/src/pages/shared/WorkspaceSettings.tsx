import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { startupService } from '@/services/myStartupService';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function WorkspaceSettings() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await startupService.getStartup(workspaceId as string);
        setData(res);
      } catch (error) {
        /* console.error removed */
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [workspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const currentApproved = data.approvedMembers || 0;
    const newMax = parseInt(data.maxMembers || '10', 10);
    if (newMax < currentApproved) {
      toast.error(`Maximum Members cannot be less than the current approved members (${currentApproved}).`);
      return;
    }

    setSaving(true);
    try {
      await startupService.updateStartup(workspaceId as string, data);
      toast.success('Settings saved successfully');
    } catch (error) {
      /* console.error removed */
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const isFounder = user?.role === 'FOUNDER';

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-6 pt-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold text-white">Workspace Settings</h2>
        <p className="text-white/80 mt-1">Manage your startup profile, visibility, and members.</p>
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col glass-surface rounded-2xl shadow-sm border border-[var(--glass-border)] dark:border-gray-700 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Startup Name</label>
              <input
                type="text"
                value={data.name || ''}
                onChange={e => setData({ ...data, name: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary glass-surface dark:border-gray-700 dark:text-white px-4 py-2 border"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Tagline</label>
              <input
                type="text"
                value={data.tagline || ''}
                onChange={e => setData({ ...data, tagline: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary glass-surface dark:border-gray-700 dark:text-white px-4 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Logo URL</label>
              <input
                type="text"
                value={data.logoUrl || ''}
                onChange={e => setData({ ...data, logoUrl: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary glass-surface dark:border-gray-700 dark:text-white px-4 py-2 border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Visibility</label>
              <select
                value={data.status || 'DRAFT'}
                onChange={e => setData({ ...data, status: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary glass-surface dark:border-gray-700 dark:text-white px-4 py-2 border"
              >
                <option value="DRAFT">Private (Draft)</option>
                <option value="PUBLISHED">Public (Published)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[var(--glass-border)] dark:border-gray-700 mt-4">
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Maximum Members</label>
              <input
                type="number"
                min={data.approvedMembers || 1}
                value={data.maxMembers || 10}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setData({ ...data, maxMembers: val });
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary glass-surface dark:border-gray-700 dark:text-white px-4 py-2 border"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">This defines the maximum number of approved members allowed in the workspace. Cannot be less than {data.approvedMembers || 0}.</p>
            </div>
            
            <div className="glass-surface rounded-lg p-4 mt-6 border border-[var(--glass-border)] dark:border-gray-700">
              <h4 className="text-sm font-semibold text-foreground dark:text-white mb-3">Capacity Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-muted-foreground dark:text-muted-foreground">Current Approved Members:</span>
                  <span className="font-medium text-foreground dark:text-white">{data.approvedMembers || 0}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground dark:text-muted-foreground">Available Slots:</span>
                  <span className="font-medium text-foreground dark:text-white">{Math.max(0, (data.maxMembers || 10) - (data.approvedMembers || 0))}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[var(--glass-border)] dark:border-gray-700">
                  <span className="block text-muted-foreground dark:text-muted-foreground">Application Status:</span>
                  <span className={`font-medium ${(data.maxMembers || 10) > (data.approvedMembers || 0) ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.maxMembers || 10) > (data.approvedMembers || 0) ? 'Open (Accepting Applications)' : 'Closed (Maximum Capacity Reached)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--glass-border)] dark:border-gray-700 flex justify-end bg-black/5 dark:bg-black/20 shrink-0">
          <button
            type="submit"
            disabled={saving || !isFounder}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="glass-surface rounded-2xl shadow-sm border border-red-500/30 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
        <div className="p-6">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-white/70 mb-6">Irreversible and destructive actions for this workspace.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {!isFounder ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4 mr-2" /> Leave Workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Workspace</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave {data.name}? You will lose access to all chats and files instantly.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      toast.info("Leave Workspace API coming soon");
                      navigate('/talent/dashboard');
                    }} className="bg-red-600 hover:bg-red-700">Yes, Leave</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete <strong>{data.name}</strong>, remove all members, and destroy all data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => {
                      try {
                        await startupService.deleteStartup(workspaceId as string);
                        toast.success("Workspace deleted");
                        navigate('/founder/dashboard');
                      } catch (err) {
                        toast.error("Failed to delete workspace");
                      }
                    }} className="bg-red-600 hover:bg-red-700">Yes, Delete Everything</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


