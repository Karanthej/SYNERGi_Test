import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getImageUrl } from '@/lib/utils';
// @ts-ignore
import defaultBg from '@/assets/origin-bg.png';

export function GlobalBackgroundEngine() {
  const { appBackgroundUrl, theme } = useSettingsStore();
  const [currentBg, setCurrentBg] = useState<string>(defaultBg);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (appBackgroundUrl) {
      setCurrentBg(getImageUrl(appBackgroundUrl));
    } else {
      setCurrentBg(defaultBg);
    }
  }, [appBackgroundUrl]);

  // Determine system theme if 'system' is selected
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  // Handle live synchronization across tabs!
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // Zustand persist default storage key is usually the store name or what was configured.
      // useSettingsStore uses 'settings-storage' or similar. 
      // We can just forcefully tell zustand to re-hydrate when storage changes!
      if (e.key && e.key.includes('settings')) {
        useSettingsStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -100 }}>
      {/* Background Image Layer with Crossfade */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${currentBg}")` }}
        />
      </AnimatePresence>

      {/* Smart Contrast Overlay for Glass UI Compatibility */}
      <motion.div 
        className="absolute inset-0 transition-colors duration-700 ease-in-out"
        animate={{
          backgroundColor: isDark ? 'rgba(10, 10, 20, 0.4)' : 'rgba(255, 255, 255, 0.3)'
        }}
      />
    </div>
  );
}
