import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uuid: string;
  fullName: string;
  email: string;
  username?: string;
  role: string;
  accountStatus: string;
  isProfileComplete: boolean;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        localStorage.removeItem('notification-storage');
        localStorage.removeItem('search-storage');
        localStorage.removeItem('onboarding-storage');
        localStorage.removeItem('settings-storage');
        localStorage.removeItem('chat-storage');
        localStorage.removeItem('call-storage');
        if (window.Clerk) {
          window.Clerk.signOut().then(() => {
            window.location.href = "/login";
          });
        } else {
          window.location.href = "/login";
        }
      },
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
);
