import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // General Settings
  theme: 'light' | 'dark' | 'system';
  showOnlineStatus: boolean;
  profileVisibility: 'public' | 'workspace_only';
  playSoundOnMessage: boolean;
  playRingtoneOnCall: boolean;
  
  // Personalization - Background
  appBackgroundUrl: string | null;
  
  // Personalization - Colors
  primaryColor: string;         // HSL string e.g. "221.2 83.2% 53.3%"
  secondaryColor: string;       // HSL string
  accentColor: string;          // HSL string (kept for compat, mirrors primaryColor)
  destructiveColor: string;     // HSL string - warning/danger
  successColor: string;         // HSL string - success states
  warningColor: string;         // HSL string - warning states
  
  // Personalization - UI Style
  glassOpacity: 'high' | 'medium' | 'low';
  sidebarStyle: 'glass' | 'solid' | 'minimal';
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'sm' | 'md' | 'lg';
  borderRadius: 'sharp' | 'rounded' | 'extra-rounded';
  animationSpeed: 'none' | 'reduced' | 'normal' | 'expressive';
  
  // Personalization - Layout
  sidebarPosition: 'left' | 'right';
  compactMode: boolean;
  showAvatars: boolean;

  // Notification Settings - Chat
  notifyDirectMessagesPush: boolean;
  notifyDirectMessagesEmail: boolean;
  notifyGroupMentionsPush: boolean;
  notifyGroupMentionsEmail: boolean;

  // Notification Settings - Voice & Meetings
  notifyIncomingCallsPush: boolean;
  notifyMeetingAlertsPush: boolean;
  notifyMeetingAlertsEmail: boolean;

  // Notification Settings - Workspace
  notifyWorkspaceInvitesPush: boolean;
  notifyWorkspaceInvitesEmail: boolean;
  notifyTaskAssignmentsPush: boolean;
  notifyTaskAssignmentsEmail: boolean;

  // Notification Settings - Network & Matching
  notifyNewMatchesPush: boolean;
  notifyNewMatchesEmail: boolean;
  notifyApplicationUpdatesPush: boolean;
  notifyApplicationUpdatesEmail: boolean;

  updateSetting: <K extends keyof Omit<SettingsState, 'updateSetting' | 'resetPersonalization'>>(key: K, value: SettingsState[K]) => void;
  resetPersonalization: () => void;
}

const DEFAULT_PERSONALIZATION = {
  appBackgroundUrl: null,
  primaryColor: '226 100% 61%',
  secondaryColor: '217 32% 15%',
  accentColor: '226 100% 61%',
  destructiveColor: '0 84.2% 60.2%',
  successColor: '142.1 76.2% 36.3%',
  warningColor: '47.9 95.8% 53.1%',
  glassOpacity: 'high' as const,
  sidebarStyle: 'glass' as const,
  fontFamily: 'sans' as const,
  fontSize: 'md' as const,
  borderRadius: 'rounded' as const,
  animationSpeed: 'normal' as const,
  sidebarPosition: 'left' as const,
  compactMode: false,
  showAvatars: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      theme: 'system',
      showOnlineStatus: true,
      profileVisibility: 'public',
      playSoundOnMessage: true,
      playRingtoneOnCall: true,
      
      ...DEFAULT_PERSONALIZATION,

      notifyDirectMessagesPush: true,
      notifyDirectMessagesEmail: false,
      notifyGroupMentionsPush: true,
      notifyGroupMentionsEmail: true,

      notifyIncomingCallsPush: true,
      notifyMeetingAlertsPush: true,
      notifyMeetingAlertsEmail: true,

      notifyWorkspaceInvitesPush: true,
      notifyWorkspaceInvitesEmail: true,
      notifyTaskAssignmentsPush: true,
      notifyTaskAssignmentsEmail: true,

      notifyNewMatchesPush: true,
      notifyNewMatchesEmail: true,
      notifyApplicationUpdatesPush: true,
      notifyApplicationUpdatesEmail: true,

      updateSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
      resetPersonalization: () => set((state) => ({ ...state, ...DEFAULT_PERSONALIZATION })),
    }),
    {
      name: 'user-settings',
    }
  )
);
