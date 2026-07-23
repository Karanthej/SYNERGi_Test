// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Phone, PhoneOff, PhoneMissed, Clock, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallAnalyticsDto {
  averageRtt: number;
  maxRtt: number;
  averageJitter: number;
  maxJitter: number;
  averagePacketLoss: number;
  maxPacketLoss: number;
  averageBitrate: number;
  iceRestarts: number;
  reconnections: number;
  turnUsed: boolean;
  stunUsed: boolean;
  muteCount: number;
  deviceChanges: number;
  browser: string;
}

interface CallLogResponse {
  uuid: string;
  callerId: string;
  receiverId: string;
  status: string;
  durationSeconds: number;
  startedAt: string;
  analytics?: CallAnalyticsDto;
}

export function VoiceAnalyticsDashboard({ workspaceId }: { workspaceId: string }) {
  const { data: calls = [], isLoading } = useQuery<CallLogResponse[]>({
    queryKey: ['voiceAnalytics', workspaceId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/calls`);
      return res.data;
    }
  });

  const [filter, setFilter] = useState('ALL');

  const filteredCalls = useMemo(() => {
    if (filter === 'ALL') return calls;
    return calls.filter(c => c.status === filter);
  }, [calls, filter]);

  const stats = useMemo(() => {
    const total = calls.length;
    const answered = calls.filter(c => c.status === 'ENDED' || c.status === 'CONNECTED').length;
    const missed = calls.filter(c => c.status === 'MISSED' || c.status === 'TIMEOUT').length;
    const failed = calls.filter(c => c.status === 'FAILED' || c.status === 'REJECTED').length;
    
    const validDurations = calls.filter(c => c.durationSeconds > 0);
    const avgDuration = validDurations.length > 0 
      ? validDurations.reduce((acc, c) => acc + c.durationSeconds, 0) / validDurations.length 
      : 0;

    const withAnalytics = calls.filter(c => c.analytics);
    const avgRtt = withAnalytics.length > 0
      ? withAnalytics.reduce((acc, c) => acc + (c.analytics?.averageRtt || 0), 0) / withAnalytics.length
      : 0;

    const turnUsage = withAnalytics.filter(c => c.analytics?.turnUsed).length;

    return { total, answered, missed, failed, avgDuration, avgRtt, turnUsage };
  }, [calls]);

  const chartData = useMemo(() => {
    // Group by day for the last 7 days
    const days: any = {};
    [...calls].reverse().forEach(c => {
      const date = new Date(c.startedAt).toLocaleDateString();
      if (!days[date]) {
        days[date] = { date, calls: 0, avgRtt: 0, countWithRtt: 0 };
      }
      days[date].calls++;
      if (c.analytics && c.analytics.averageRtt > 0) {
        days[date].avgRtt += c.analytics.averageRtt;
        days[date].countWithRtt++;
      }
    });

    return Object.values(days).map((d: any) => ({
      date: d.date,
      calls: d.calls,
      avgRtt: d.countWithRtt > 0 ? Math.round(d.avgRtt / d.countWithRtt) : 0
    }));
  }, [calls]);

  const exportCSV = () => {
    const headers = ['UUID', 'Status', 'Duration (s)', 'Started At', 'Avg RTT', 'Packet Loss', 'Bitrate', 'ICE Restarts'];
    const rows = filteredCalls.map(c => [
      c.uuid,
      c.status,
      c.durationSeconds,
      new Date(c.startedAt).toISOString(),
      c.analytics?.averageRtt?.toFixed(2) || 'N/A',
      c.analytics?.averagePacketLoss?.toFixed(2) || 'N/A',
      c.analytics?.averageBitrate?.toFixed(2) || 'N/A',
      c.analytics?.iceRestarts || 0
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "voice_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredCalls, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "voice_analytics.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading Analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Voice Analytics & Monitoring</h1>
          <p className="text-slate-500">Real-time WebRTC telemetry and usage metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button variant="outline" onClick={exportJSON}><Download className="w-4 h-4 mr-2" /> Export JSON</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Answered / Missed</CardTitle>
            <PhoneMissed className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.answered} <span className="text-slate-300">/</span> <span className="text-red-500">{stats.missed}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Clock className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgDuration)}s</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average RTT (Latency)</CardTitle>
            <Activity className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRtt.toFixed(1)}ms</div>
            <p className="text-xs text-slate-500">{stats.turnUsage} calls routed via TURN Relay</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Latency Trend (RTT)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="avgRtt" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Call Logs</CardTitle>
          <div className="flex gap-2">
            <select className="px-3 py-1 border rounded-md text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All Calls</option>
              <option value="ENDED">Answered</option>
              <option value="MISSED">Missed</option>
              <option value="FAILED">Failed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Avg RTT</th>
                  <th className="px-4 py-3">Packet Loss</th>
                  <th className="px-4 py-3">Bitrate</th>
                  <th className="px-4 py-3">ICE Restarts</th>
                  <th className="px-4 py-3">Relay</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.slice(0, 50).map((call) => (
                  <tr key={call.uuid} className="border-b dark:border-slate-800">
                    <td className="px-4 py-3">{new Date(call.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        call.status === 'ENDED' ? 'bg-green-100 text-green-700' : 
                        call.status === 'MISSED' ? 'bg-red-100 text-red-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{call.durationSeconds}s</td>
                    <td className="px-4 py-3">{call.analytics?.averageRtt ? `${call.analytics.averageRtt.toFixed(1)}ms` : '-'}</td>
                    <td className="px-4 py-3">{call.analytics?.averagePacketLoss ? `${call.analytics.averagePacketLoss.toFixed(2)}%` : '-'}</td>
                    <td className="px-4 py-3">{call.analytics?.averageBitrate ? `${Math.round(call.analytics.averageBitrate / 1000)}kbps` : '-'}</td>
                    <td className="px-4 py-3">{call.analytics?.iceRestarts || 0}</td>
                    <td className="px-4 py-3">{call.analytics?.turnUsed ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
