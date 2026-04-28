import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { THEMES, ThemeId, Mode, IconPackId, TypeSetId, MotifId, Theme } from './themes';

interface ThemeContextType {
  themeId: ThemeId;
  mode: Mode;
  resolvedDark: boolean;
  iconPack: IconPackId;
  motif: MotifId;
  typeset: TypeSetId;
  setTheme: (id: ThemeId) => void;
  setMode: (mode: Mode) => void;
  setIconPackOverride: (id: IconPackId | null) => void;
  setTypesetOverride: (id: TypeSetId | null) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => 
    (localStorage.getItem('deen.theme') as ThemeId) || 'madinah-dawn'
  );
  
  const [mode, setModeState] = useState<Mode>(() => 
    (localStorage.getItem('deen.mode') as Mode) || 'system'
  );
  
  const [iconOverride, setIconOverrideState] = useState<IconPackId | null>(() => 
    (localStorage.getItem('deen.icons-override') as IconPackId) || null
  );
  
  const [typeOverride, setTypeOverrideState] = useState<TypeSetId | null>(() => 
    (localStorage.getItem('deen.typeset-override') as TypeSetId) || null
  );

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);
  
  const iconPack = iconOverride || theme.icons;
  const typeset = typeOverride || theme.typeset;
  const motif = theme.motif;

  const [resolvedDark, setResolvedDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-motif', motif);
    root.setAttribute('data-icons', iconPack);
    root.setAttribute('data-typeset', typeset);
    
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && isSystemDark);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setResolvedDark(isDark);
  }, [theme.id, mode, iconPack, typeset, motif]);

  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        const root = window.document.documentElement;
        if (e.matches) {
          root.classList.add('dark');
          setResolvedDark(true);
        } else {
          root.classList.remove('dark');
          setResolvedDark(false);
        }
      }
    };
    
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [mode]);

  const setTheme = (id: ThemeId) => {
    localStorage.setItem('deen.theme', id);
    setThemeIdState(id);
  };

  const setMode = (m: Mode) => {
    localStorage.setItem('deen.mode', m);
    setModeState(m);
  };

  const setIconPackOverride = (id: IconPackId | null) => {
    if (id) localStorage.setItem('deen.icons-override', id);
    else localStorage.removeItem('deen.icons-override');
    setIconOverrideState(id);
  };

  const setTypesetOverride = (id: TypeSetId | null) => {
    if (id) localStorage.setItem('deen.typeset-override', id);
    else localStorage.removeItem('deen.typeset-override');
    setTypeOverrideState(id);
  };

  const value = {
    themeId,
    mode,
    resolvedDark,
    iconPack,
    motif,
    typeset,
    setTheme,
    setMode,
    setIconPackOverride,
    setTypesetOverride,
    themes: THEMES
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
