
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/useSettingsStore';
import { MessageSquare, Phone, Briefcase, Sparkles } from 'lucide-react';

export function NotificationSettingsSection() {
  const settings = useSettingsStore();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><MessageSquare className="w-5 h-5 mr-2 text-primary" /> Chat Notifications</CardTitle>
          <CardDescription>Configure how you are notified about new messages and mentions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Direct Messages</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyDirectMessagesPush} onCheckedChange={(v) => settings.updateSetting('notifyDirectMessagesPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyDirectMessagesEmail} onCheckedChange={(v) => settings.updateSetting('notifyDirectMessagesEmail', v)} />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Group Mentions</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyGroupMentionsPush} onCheckedChange={(v) => settings.updateSetting('notifyGroupMentionsPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyGroupMentionsEmail} onCheckedChange={(v) => settings.updateSetting('notifyGroupMentionsEmail', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Phone className="w-5 h-5 mr-2 text-primary" /> Voice & Meetings</CardTitle>
          <CardDescription>Manage alerts for incoming calls and scheduled meetings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Incoming Voice Calls</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyIncomingCallsPush} onCheckedChange={(v) => settings.updateSetting('notifyIncomingCallsPush', v)} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Scheduled Meetings</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyMeetingAlertsPush} onCheckedChange={(v) => settings.updateSetting('notifyMeetingAlertsPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyMeetingAlertsEmail} onCheckedChange={(v) => settings.updateSetting('notifyMeetingAlertsEmail', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Briefcase className="w-5 h-5 mr-2 text-primary" /> Workspace & Activity</CardTitle>
          <CardDescription>Stay updated on workspace invites and task assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Workspace Invitations</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyWorkspaceInvitesPush} onCheckedChange={(v) => settings.updateSetting('notifyWorkspaceInvitesPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyWorkspaceInvitesEmail} onCheckedChange={(v) => settings.updateSetting('notifyWorkspaceInvitesEmail', v)} />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Task Assignments</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyTaskAssignmentsPush} onCheckedChange={(v) => settings.updateSetting('notifyTaskAssignmentsPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyTaskAssignmentsEmail} onCheckedChange={(v) => settings.updateSetting('notifyTaskAssignmentsEmail', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Sparkles className="w-5 h-5 mr-2 text-primary" /> Network & Matching</CardTitle>
          <CardDescription>Alerts for new founder/talent matches and application status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">New Matches</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyNewMatchesPush} onCheckedChange={(v) => settings.updateSetting('notifyNewMatchesPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyNewMatchesEmail} onCheckedChange={(v) => settings.updateSetting('notifyNewMatchesEmail', v)} />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground dark:text-gray-100">Application Updates</h4>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Push Notifications</Label>
              <Switch checked={settings.notifyApplicationUpdatesPush} onCheckedChange={(v) => settings.updateSetting('notifyApplicationUpdatesPush', v)} />
            </div>
            <div className="flex items-center justify-between ml-4">
              <Label className="font-normal text-muted-foreground">Email Notifications</Label>
              <Switch checked={settings.notifyApplicationUpdatesEmail} onCheckedChange={(v) => settings.updateSetting('notifyApplicationUpdatesEmail', v)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

