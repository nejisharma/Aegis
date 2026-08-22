import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getPref, setPref } from '../lib/storage';
import { darkColors, lightColors, type Palette } from './palettes';

export type ThemeMode = 'dark' | 'light' | 'system';

const PREF_KEY = 'theme-mode';
const MODES: ThemeMode[] = ['dark', 'light', 'system'];

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {},
  colors: darkColors,
  isDark: true,
});

/** Loads the persisted theme mode, then renders children. Renders null until loaded. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode | null>(null);
  const scheme = useColorScheme();

  useEffect(() => {
    let mounted = true;
    getPref<ThemeMode>(PREF_KEY, 'dark')
      .then((m) => {
        if (mounted) setModeState(MODES.includes(m) ? m : 'dark');
      })
      .catch(() => {
        if (mounted) setModeState('dark');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setPref(PREF_KEY, m).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue | null>(() => {
    if (!mode) return null;
    const isDark = mode === 'system' ? scheme !== 'light' : mode === 'dark';
    return { mode, setMode, colors: isDark ? darkColors : lightColors, isDark };
  }, [mode, scheme, setMode]);

  if (!value) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}
