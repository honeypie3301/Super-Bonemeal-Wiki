import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type WikiTheme = 'emerald' | 'starlight' | 'archival-dusk' | 'warm-archival';

export type BaseWikiTheme = Exclude<WikiTheme, 'starlight'>;

export interface ThemeMeta {
  id: WikiTheme;
  label: string;
  description: string;
  swatchBg: string;
  swatchAccent: string;
  themeColor: string;
  isDark: boolean;
}

export const WIKI_THEMES: ThemeMeta[] = [
  {
    id: 'emerald',
    label: 'Emerald Forest',
    description: 'Classic obsidian sage & pine',
    swatchBg: '#0c0f0d',
    swatchAccent: '#709978',
    themeColor: '#080a08',
    isDark: true,
  },
  {
    id: 'archival-dusk',
    label: 'Archival Dusk',
    description: 'Espresso paper & warm amber ink',
    swatchBg: '#1b1613',
    swatchAccent: '#d9822b',
    themeColor: '#13100e',
    isDark: true,
  },
  {
    id: 'warm-archival',
    label: 'Warm Archival',
    description: 'Cream parchment & terracotta ink',
    swatchBg: '#f9f6f0',
    swatchAccent: '#b45309',
    themeColor: '#f9f6f0',
    isDark: false,
  },
  {
    id: 'starlight',
    label: 'Starlight Obsidian',
    description: 'Celestial void & monochrome silver',
    swatchBg: '#000000',
    swatchAccent: '#e4e4e7',
    themeColor: '#000000',
    isDark: true,
  },
];

interface ThemeContextType {
  theme: WikiTheme;
  baseTheme: BaseWikiTheme;
  toggleTheme: () => void;
  cycleTheme: (step?: 1 | -1) => void;
  toggleArchivalTheme: () => void;
  setTheme: (theme: WikiTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'archival-dusk',
  baseTheme: 'archival-dusk',
  toggleTheme: () => {},
  cycleTheme: () => {},
  toggleArchivalTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = 'backwoods_wiki_theme';
const BASE_THEME_STORAGE_KEY = 'backwoods_wiki_base_theme';

let memoryThemeCache: WikiTheme | null = null;
let memoryBaseThemeCache: BaseWikiTheme | null = null;

function isValidTheme(value: string | null | undefined): value is WikiTheme {
  return (
    value === 'emerald' ||
    value === 'starlight' ||
    value === 'archival-dusk' ||
    value === 'warm-archival'
  );
}

function isBaseTheme(value: string | null | undefined): value is BaseWikiTheme {
  return value === 'emerald' || value === 'archival-dusk' || value === 'warm-archival';
}

function readWindowNameTheme(field: '__bwTheme' | '__bwBaseTheme'): string | null {
  try {
    if (typeof window === 'undefined' || !window.name) return null;
    if (window.name.trim().startsWith('{')) {
      const parsed = JSON.parse(window.name);
      if (parsed && typeof parsed[field] === 'string') return parsed[field];
    }
    const match = window.name.match(new RegExp(`${field}=([a-z-]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function writeWindowNameTheme(themeValue?: WikiTheme, baseValue?: BaseWikiTheme) {
  try {
    if (typeof window === 'undefined') return;
    const current = window.name || '';
    if (!current || current.trim().startsWith('{')) {
      let obj: Record<string, unknown> = {};
      if (current.trim().startsWith('{')) {
        try {
          obj = JSON.parse(current) || {};
        } catch {
          obj = {};
        }
      }
      if (themeValue) obj.__bwTheme = themeValue;
      if (baseValue) obj.__bwBaseTheme = baseValue;
      window.name = JSON.stringify(obj);
      return;
    }
    let next = current
      .replace(/\|?__bwTheme=[a-z-]+/g, '')
      .replace(/\|?__bwBaseTheme=[a-z-]+/g, '');
    if (themeValue) next += `${next ? '|' : ''}__bwTheme=${themeValue}`;
    if (baseValue) next += `${next ? '|' : ''}__bwBaseTheme=${baseValue}`;
    window.name = next;
  } catch {
    // Ignore restricted window.name errors
  }
}

function readCookieValue(name: string): string | null {
  try {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([a-z-]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function readPersistedTheme(): WikiTheme {
  if (memoryThemeCache && isValidTheme(memoryThemeCache)) {
    return memoryThemeCache;
  }
  try {
    const domAttr = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;
    const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    if (isValidTheme(fromLocal)) return fromLocal;
    const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(THEME_STORAGE_KEY) : null;
    if (isValidTheme(fromSession)) return fromSession;
    const fromWin = readWindowNameTheme('__bwTheme');
    if (isValidTheme(fromWin)) return fromWin;
    const fromCookie = readCookieValue(THEME_STORAGE_KEY);
    if (isValidTheme(fromCookie)) return fromCookie;
    if (isValidTheme(domAttr)) return domAttr;
  } catch {
    // Fallback below
  }
  return 'archival-dusk';
}

function readPersistedBaseTheme(): BaseWikiTheme {
  if (memoryBaseThemeCache && isBaseTheme(memoryBaseThemeCache)) {
    return memoryBaseThemeCache;
  }
  try {
    const fromLocalBase = typeof localStorage !== 'undefined' ? localStorage.getItem(BASE_THEME_STORAGE_KEY) : null;
    if (isBaseTheme(fromLocalBase)) return fromLocalBase;
    const fromSessionBase = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(BASE_THEME_STORAGE_KEY) : null;
    if (isBaseTheme(fromSessionBase)) return fromSessionBase;
    const fromWinBase = readWindowNameTheme('__bwBaseTheme');
    if (isBaseTheme(fromWinBase)) return fromWinBase;
    const fromCookieBase = readCookieValue(BASE_THEME_STORAGE_KEY);
    if (isBaseTheme(fromCookieBase)) return fromCookieBase;
  } catch {
    // Ignore
  }
  const active = readPersistedTheme();
  return isBaseTheme(active) ? active : 'archival-dusk';
}

function persistThemeChoice(newTheme: WikiTheme, newBaseTheme?: BaseWikiTheme) {
  memoryThemeCache = newTheme;
  if (newBaseTheme) {
    memoryBaseThemeCache = newBaseTheme;
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    if (newBaseTheme) localStorage.setItem(BASE_THEME_STORAGE_KEY, newBaseTheme);
  } catch {}
  try {
    sessionStorage.setItem(THEME_STORAGE_KEY, newTheme);
    if (newBaseTheme) sessionStorage.setItem(BASE_THEME_STORAGE_KEY, newBaseTheme);
  } catch {}
  writeWindowNameTheme(newTheme, newBaseTheme);
  try {
    document.cookie = `${THEME_STORAGE_KEY}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    if (newBaseTheme) {
      document.cookie = `${BASE_THEME_STORAGE_KEY}=${newBaseTheme}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [baseTheme, setBaseThemeState] = useState<BaseWikiTheme>(readPersistedBaseTheme);
  const [theme, setThemeState] = useState<WikiTheme>(readPersistedTheme);

  const setTheme = useCallback((newTheme: WikiTheme) => {
    setThemeState(newTheme);
    if (newTheme !== 'starlight') {
      setBaseThemeState(newTheme);
      persistThemeChoice(newTheme, newTheme);
    } else {
      persistThemeChoice(newTheme);
    }
  }, []);

  const cycleTheme = useCallback((step: 1 | -1 = 1) => {
    setThemeState((prev) => {
      const idx = WIKI_THEMES.findIndex((t) => t.id === prev);
      const safeIdx = idx === -1 ? 0 : idx;
      const nextTheme = WIKI_THEMES[(safeIdx + step + WIKI_THEMES.length) % WIKI_THEMES.length].id;
      if (nextTheme !== 'starlight') {
        setBaseThemeState(nextTheme);
        persistThemeChoice(nextTheme, nextTheme);
      } else {
        persistThemeChoice(nextTheme);
      }
      return nextTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    cycleTheme(1);
  }, [cycleTheme]);

  const toggleArchivalTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme: WikiTheme =
        prev === 'archival-dusk' ? 'warm-archival' : 'archival-dusk';
      setBaseThemeState(nextTheme);
      persistThemeChoice(nextTheme, nextTheme);
      return nextTheme;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && isValidTheme(e.newValue)) {
        memoryThemeCache = e.newValue;
        setThemeState(e.newValue);
        if (e.newValue !== 'starlight') {
          memoryBaseThemeCache = e.newValue;
          setBaseThemeState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    persistThemeChoice(theme, theme !== 'starlight' ? theme : undefined);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme !== 'warm-archival');

    const metaTheme = WIKI_THEMES.find((t) => t.id === theme);
    if (metaTheme) {
      const themeMetaEl = document.querySelector('meta[name="theme-color"]');
      if (themeMetaEl) {
        themeMetaEl.setAttribute('content', metaTheme.themeColor);
      }
    }
  }, [theme]);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme,
      baseTheme,
      toggleTheme,
      cycleTheme,
      toggleArchivalTheme,
      setTheme,
    }),
    [theme, baseTheme, toggleTheme, cycleTheme, toggleArchivalTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
