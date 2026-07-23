import React, { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import {} from '@/lib/utils';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const {
    theme,
    primaryColor,
    secondaryColor,
    destructiveColor,
    successColor,
    warningColor,
    glassOpacity,
    sidebarStyle,
    fontFamily,
    fontSize,
    borderRadius,
    animationSpeed,
    compactMode,
    showAvatars,
  } = useSettingsStore();

  // ── Theme (light/dark/system) ──────────────────────────────────────────────
  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeToApply: 'light' | 'dark' | 'system') => {
      root.classList.remove('light', 'dark');
      if (themeToApply === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(themeToApply);
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // ── All Personalization Settings ───────────────────────────────────────────
  useEffect(() => {
    const root = window.document.documentElement; // <html>
    const body = window.document.body;

    // Background Image logic moved to GlobalBackgroundEngine.tsx

    // ── Color Palette ─────────────────────────────────────────────────────
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--ring', primaryColor);
    root.style.setProperty('--accent', primaryColor);
    root.style.setProperty('--secondary', secondaryColor);
    root.style.setProperty('--destructive', destructiveColor);
    root.style.setProperty('--success', successColor);
    root.style.setProperty('--warning', warningColor);

    // Update the glow shadow to match current primary color
    const [h, s, l] = primaryColor.split(' ');
    root.style.setProperty('--shadow-glow-val', `0 0 24px hsl(${h} ${s} ${l} / 0.4)`);

    // ── Glass Opacity ─────────────────────────────────────────────────────
    body.classList.remove('glass-opacity-low', 'glass-opacity-medium', 'glass-opacity-high');
    body.classList.add(`glass-opacity-${glassOpacity}`);

    // ── Sidebar Style ─────────────────────────────────────────────────────
    body.classList.remove('sidebar-glass', 'sidebar-solid', 'sidebar-minimal');
    body.classList.add(`sidebar-${sidebarStyle}`);

    // ── Font Family ───────────────────────────────────────────────────────
    body.classList.remove('font-sans', 'font-serif', 'font-mono');
    body.classList.add(`font-${fontFamily || 'sans'}`);

    // ── Font Size ─────────────────────────────────────────────────────────
    body.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
    body.classList.add(`font-size-${fontSize || 'md'}`);
    const fontSizeMap = { sm: '13px', md: '15px', lg: '17px' };
    root.style.fontSize = fontSizeMap[fontSize as keyof typeof fontSizeMap] || '15px';

    // ── Border Radius ─────────────────────────────────────────────────────
    let radiusValue = '0.75rem';
    if (borderRadius === 'sharp') radiusValue = '0rem';
    if (borderRadius === 'extra-rounded') radiusValue = '1.5rem';
    root.style.setProperty('--radius', radiusValue);

    // ── Animation Speed ───────────────────────────────────────────────────
    body.classList.remove('anim-none', 'anim-reduced', 'anim-normal', 'anim-expressive');
    body.classList.add(`anim-${animationSpeed || 'normal'}`);

    // ── Compact Mode ──────────────────────────────────────────────────────
    body.classList.toggle('compact-mode', compactMode);

    // ── Show Avatars ──────────────────────────────────────────────────────
    body.classList.toggle('hide-avatars', !showAvatars);

  }, [
    primaryColor,
    secondaryColor,
    destructiveColor,
    successColor,
    warningColor,
    glassOpacity,
    sidebarStyle,
    fontFamily,
    fontSize,
    borderRadius,
    animationSpeed,
    compactMode,
    showAvatars,
  ]);

  return <>{children}</>;
}
