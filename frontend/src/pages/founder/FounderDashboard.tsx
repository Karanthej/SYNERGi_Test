import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from 'react-router-dom';
import { apiClient as api } from '@/lib/apiClient';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItemFadeSlideUp } from '@/lib/animations';

interface AnalyticsData {
  totalStartups: number;
  publishedStartups: number;
  activeTeamMembers: number;
  pendingApplications: number;
  acceptedApplications: number;
  recentTasks: any[];
}

export default function FounderDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get<{ data: AnalyticsData }>('/analytics/founder');
        setData(res.data.data);
      } catch (error) {
        /* console.error removed */
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-0 sm:p-4 lg:p-8 w-full max-w-[1920px] mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-48 sm:w-64" />
            <Skeleton className="h-5 w-64 sm:w-full max-w-80" />
          </div>
          <Skeleton className="h-[38px] w-[135px] rounded-lg mt-2 sm:mt-0" />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 sm:gap-8 items-start mt-6 sm:mt-8">
          <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
            <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
            </div>
            <Skeleton className="h-64 sm:h-[400px] rounded-xl w-full" />
          </div>
          <div className="flex flex-col gap-6 sm:gap-8">
            <Skeleton className="h-64 sm:h-[400px] rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-0 sm:p-4 lg:p-8 w-full max-w-[1920px] mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Founder Analytics</h2>
          <p className="text-white/80 mt-2">Overview of your startups and team activity.</p>
        </div>
        <Link to="/founder/startups" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Manage Startups
        </Link>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 sm:gap-8 items-start mt-6 sm:mt-8">
        <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <motion.div variants={staggerItemFadeSlideUp}>
          <div 
            className="glass-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] cursor-pointer hover:border-primary transition-all duration-[var(--duration-normal)] ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-glow h-full"
            onClick={() => navigate('/founder/startups')}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-xs sm:text-sm font-medium text-foreground dark:text-white">Total Startups</h3>
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">{data.totalStartups}</div>
              <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 font-medium mt-1">{data.publishedStartups} Published</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={staggerItemFadeSlideUp}>
          <div 
            className="glass-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] cursor-pointer hover:border-primary transition-all duration-[var(--duration-normal)] ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-glow h-full"
            onClick={() => navigate('/founder/collaboration')}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-xs sm:text-sm font-medium text-foreground dark:text-white">Team Members</h3>
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">{data.activeTeamMembers}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground mt-1">Across all workspaces</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={staggerItemFadeSlideUp}>
          <div 
            className="glass-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] cursor-pointer hover:border-primary transition-all duration-[var(--duration-normal)] ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-glow h-full"
            onClick={() => navigate('/founder/applications')}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-xs sm:text-sm font-medium text-foreground dark:text-white">Applications</h3>
              <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">{data.pendingApplications}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground mt-1">Pending review</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={staggerItemFadeSlideUp}>
          <div 
            className="glass-surface p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--glass-border)] cursor-pointer hover:border-primary transition-all duration-[var(--duration-normal)] ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-glow h-full"
            onClick={() => navigate('/founder/applications?filter=ACCEPTED')}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-xs sm:text-sm font-medium text-foreground dark:text-white">Total Hires</h3>
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">{data.acceptedApplications}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground mt-1">Accepted applications</p>
            </div>
          </div>
        </motion.div>
          </div>
          </motion.div>

          <motion.div variants={staggerItemFadeSlideUp}>
            <Card 
              className="cursor-pointer hover:border-primary transition-all duration-[var(--duration-normal)] ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-glow h-full"
              onClick={() => navigate('/founder/collaboration')}
            >
              <CardHeader>
                <CardTitle className="text-lg text-foreground dark:text-white">Recent Workspace Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground dark:text-muted-foreground py-16">
                  No recent activity to display.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <div className="flex flex-col gap-6 sm:gap-8">
          <motion.div variants={staggerItemFadeSlideUp}>
          <Card 
            className="cursor-pointer hover:border-primary transition-all duration-[var(--duration-normal)] ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-glow h-full"
            onClick={() => navigate('/founder/collaboration')}
          >
            <CardHeader>
              <CardTitle className="text-lg text-foreground dark:text-white">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTasks.length === 0 ? (
                <div className="text-center text-muted-foreground dark:text-muted-foreground py-8">
                  No active tasks found across your startups.
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.recentTasks.map((task: any) => (
                    <li 
                      key={task.uuid} 
                      className="flex items-center justify-between p-3 glass-surface/50 rounded-xl border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/founder/workspace/${task.startupUuid}`);
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground dark:text-white text-sm">{task.title}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] py-0">{task.status?.replace('_', ' ')}</Badge>
                          {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                      </div>
                      {task.assigneeName && (
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0" title={task.assigneeName}>
                          {task.assigneeName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
      
      {/* Notifications FAB (Mobile Only) */}
      <div className="fixed bottom-24 right-4 lg:hidden z-50">
        <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-primary rounded-full"></span>
        </button>
      </div>
    </div>
  );
}


