// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient as api } from '@/lib/apiClient';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspaceService';
import { useChatStore } from '@/store/useChatStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Activity, MessageSquare, Bell } from 'lucide-react';
import {} from '@/lib/utils';
import {} from '@/components/ui/badge';

interface OverviewResponse {
  startupName: string;
  tagline: string;
  stage: string;
  logoUrl?: string;
  status?: string;
  activeTaskCount: number;
  teamMemberCount: number;
  upcomingMeetings: number;
  recentTasks: any[];
}

const WorkspaceHome: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const onlineStatuses = useChatStore(state => state.onlineStatuses);
  const notifications = useNotificationStore(state => state.notifications);

  const { data: members = [] } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => workspaceService.getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId
  });

  const onlineCount = members.filter(m => onlineStatuses[m.userUuid]?.isOnline).length;
  const workspaceNotifications = notifications.filter(n => n.workspaceUuid === workspaceId).slice(0, 10);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get<{ data: OverviewResponse }>(`/workspaces/${workspaceId}/dashboard`);
        setData(res.data.data);
      } catch (error) {
        /* console.error removed */
        toast.error('Failed to load workspace overview.');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="w-full max-w-[1920px] mx-auto h-full pr-2 pb-10 space-y-8 mt-2">
        {/* Header Skeleton */}
        <div className="glass-surface rounded-2xl p-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Skeleton className="w-24 h-24 rounded-2xl flex-shrink-0" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 sm:w-64" />
              <Skeleton className="h-5 w-32 sm:w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-lg hidden sm:block" />
        </div>

        {/* Quick Actions & Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 sm:h-[400px] w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-6 w-32 mt-6" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-full mx-auto h-full overflow-y-auto px-4 md:px-8 pb-10">
      {/* Header Section */}
      <div className="glass-surface rounded-2xl shadow-sm border border-[var(--glass-border)] p-5 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-2xl bg-primary/20 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt={data.startupName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary dark:text-primary">
                {data.startupName.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white dark:text-white">{data.startupName}</h1>
              <span className="px-3 py-1 bg-primary/10 dark:bg-indigo-900/30 text-primary dark:text-indigo-300 text-xs font-semibold rounded-full uppercase tracking-wide border border-primary/20">
                {data.stage}
              </span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide border ${data.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                {data.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-white/80 dark:text-muted-foreground text-lg max-w-2xl">{data.tagline}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="glass-surface p-4 lg:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] flex flex-col lg:flex-row items-start lg:items-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Active Tasks</p>
            <h3 className="text-3xl font-bold text-foreground dark:text-white">{data.activeTaskCount}</h3>
          </div>
        </div>
        
        <div className="glass-surface p-4 lg:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] flex flex-col lg:flex-row items-start lg:items-center">
          <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mr-4 text-green-600 dark:text-green-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Team Members</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground dark:text-white">{data.teamMemberCount}</h3>
              <span className="text-sm font-medium text-green-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                {onlineCount} Online
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 glass-surface p-4 lg:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] flex flex-col lg:flex-row items-start lg:items-center">
          <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mr-4 text-purple-600 dark:text-purple-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">Upcoming Meetings</p>
            <h3 className="text-3xl font-bold text-foreground dark:text-white">{data.upcomingMeetings ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Recent Tasks */}
        <div className="glass-surface rounded-2xl shadow-sm border border-[var(--glass-border)] overflow-hidden">
          <div className="p-6 border-b border-[var(--glass-border)] dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Recent Tasks</h2>
            <span className="text-sm font-medium text-primary/80 dark:text-primary/80 cursor-not-allowed">Coming Soon</span>
          </div>
          <div className="p-4">
            {data.recentTasks.length === 0 ? (
              <p className="text-white/80 text-center py-6">No active tasks found.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentTasks.map(task => (
                  <li key={task.uuid} className="p-4 glass-surface/50 rounded-xl flex items-center justify-between group hover:bg-primary/10 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer border border-transparent hover:border-primary/30 dark:hover:border-indigo-800">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-indigo-300 transition-colors">{task.title}</span>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <span className="mr-3 uppercase tracking-wider font-semibold text-muted-foreground">{task.status.replace('_', ' ')}</span>
                        {task.dueDate && <span>Due: {format(new Date(task.dueDate), 'MMM d')}</span>}
                      </div>
                    </div>
                    {task.assigneeName && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold" title={task.assigneeName}>
                        {task.assigneeName.charAt(0)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="glass-surface rounded-2xl shadow-sm border border-[var(--glass-border)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--glass-border)] dark:border-gray-700 flex justify-between items-center bg-black/20">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Activity Timeline
            </h2>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {workspaceNotifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                <Activity className="w-8 h-8 mb-3 opacity-20" />
                No recent activity in this workspace.
              </div>
            ) : (
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {workspaceNotifications.map(notif => (
                  <div key={notif.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#12121A] bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      {notif.type.includes('MESSAGE') ? <MessageSquare className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl glass-card border border-white/5 shadow-md">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-white text-sm">{notif.title}</div>
                        <time className="text-[10px] font-medium text-muted-foreground/80">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</time>
                      </div>
                      <div className="text-xs text-white/70 line-clamp-2">{notif.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHome;


