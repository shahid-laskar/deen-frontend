import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { THEMES, ThemeId, Mode, IconPackId, TypeSetId, MotifId, Theme } from './themes';
import { detectIslamicSeason, isAfterMaghrib } from './hijri';

interface ThemeContextType {
  themeId: ThemeId;
  mode: Mode;
  resolvedDark: boolean;
  iconPack: IconPackId;
  motif: MotifId;
  typeset: TypeSetId;
  quranScale: number;
  seasonalEnabled: boolean;
  autoDarkAfterMaghrib: boolean;
  pendingSeason: string | null;
  setTheme: (id: ThemeId) => void;
  setMode: (mode: Mode) => void;
  setIconPackOverride: (id: IconPackId | null) => void;
  setTypesetOverride: (id: TypeSetId | null) => void;
  setQuranScale: (scale: number) => void;
  setSeasonalEnabled: (enabled: boolean) => void;
  setAutoDarkAfterMaghrib: (enabled: boolean) => void;
  acceptSeason: () => void;
  declineSeason: () => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const SEASON_CLASSES: Record<string, string> = {
  ramadan: 'season-ramadan',
  eid_fitr: 'season-eid',
  eid_adha: 'season-eid',
  dhul_hijjah_10: 'season-dhul-hijjah',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // --- Persistent State ---
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
  const [quranScale, setQuranScaleState] = useState<number>(() => 
    parseFloat(localStorage.getItem('deen.quran-scale') || '1.2')
  );
  const [seasonalEnabled, setSeasonalEnabledState] = useState<boolean>(() => 
    localStorage.getItem('deen.seasonal-enabled') !== 'false'
  );
  const [autoDarkAfterMaghrib, setAutoDarkAfterMaghribState] = useState<boolean>(() => 
    localStorage.getItem('deen.auto-dark-maghrib') === 'true'
  );
  const [seasonalPermissionAsked, setSeasonalPermissionAsked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('deen.seasonal-asked') || '{}') } catch { return {} }
  });

  // --- Volatile State ---
  const [pendingSeason, setPendingSeason] = useState<string | null>(null);
  const [resolvedDark, setResolvedDark] = useState(false);
  const [, setTick] = useState(0); // Force re-render for time-based logic

  // --- Derived State ---
  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);
  const iconPack = iconOverride || theme.icons;
  const typeset = typeOverride || theme.typeset;
  const motif = theme.motif;

  // --- DOM Effects ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-motif', motif);
    root.setAttribute('data-icons', iconPack);
    root.setAttribute('data-typeset', typeset);
    root.style.setProperty('--quran-scale', String(quranScale));
    
    let isDark = mode === 'dark';
    if (mode === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (autoDarkAfterMaghrib && mode !== 'dark' && isAfterMaghrib()) {
      isDark = true;
    }

    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    setResolvedDark(isDark);

    // Seasonal themes
    Object.values(SEASON_CLASSES).forEach(cls => root.classList.remove(cls));
    if (seasonalEnabled) {
      const season = detectIslamicSeason();
      if (season && seasonalPermissionAsked[season] === true) {
        root.classList.add(SEASON_CLASSES[season]);
      } else if (season && seasonalPermissionAsked[season] === undefined) {
        setPendingSeason(season);
      }
    }
  }, [theme.id, mode, iconPack, typeset, motif, quranScale, seasonalEnabled, autoDarkAfterMaghrib, seasonalPermissionAsked]);

  // --- Background Polling (for auto-dark and season changes) ---
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  // --- Listeners ---
  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        const root = window.document.documentElement;
        const isAfterMaghribVal = autoDarkAfterMaghrib && isAfterMaghrib();
        const shouldBeDark = e.matches || isAfterMaghribVal;
        if (shouldBeDark) {
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
  }, [mode, autoDarkAfterMaghrib]);

  // --- Setters ---
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
  const setQuranScale = (scale: number) => {
    localStorage.setItem('deen.quran-scale', String(scale));
    setQuranScaleState(scale);
  };
  const setSeasonalEnabled = (enabled: boolean) => {
    localStorage.setItem('deen.seasonal-enabled', String(enabled));
    setSeasonalEnabledState(enabled);
  };
  const setAutoDarkAfterMaghrib = (enabled: boolean) => {
    localStorage.setItem('deen.auto-dark-maghrib', String(enabled));
    setAutoDarkAfterMaghribState(enabled);
  };

  const acceptSeason = () => {
    if (!pendingSeason) return;
    const next = { ...seasonalPermissionAsked, [pendingSeason]: true };
    localStorage.setItem('deen.seasonal-asked', JSON.stringify(next));
    setSeasonalPermissionAsked(next);
    setPendingSeason(null);
  };

  const declineSeason = () => {
    if (!pendingSeason) return;
    const next = { ...seasonalPermissionAsked, [pendingSeason]: false };
    localStorage.setItem('deen.seasonal-asked', JSON.stringify(next));
    setSeasonalPermissionAsked(next);
    setPendingSeason(null);
  };

  const value = {
    themeId,
    mode,
    resolvedDark,
    iconPack,
    motif,
    typeset,
    quranScale,
    seasonalEnabled,
    autoDarkAfterMaghrib,
    pendingSeason,
    setTheme,
    setMode,
    setIconPackOverride,
    setTypesetOverride,
    setQuranScale,
    setSeasonalEnabled,
    setAutoDarkAfterMaghrib,
    acceptSeason,
    declineSeason,
    themes: THEMES
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
