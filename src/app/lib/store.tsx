import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { generateImages } from './imageApi';
import type { GenerationRequest, GenerationResult, AspectRatio, AppUser } from './imageApi';

export type View = 'home' | 'works' | 'prompts';
export type NavKey = 'home' | 'gallery' | 'prompts' | 'works' | 'pro';
export type Theme = 'dark' | 'light';

type RemixSeed = {
  prompt: string;
  ratio?: AspectRatio;
  style?: string;
  referenceUrl?: string;
};

function toAbsoluteImageUrl(url?: string) {
  if (!url) return '';
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

type GenerationJob = {
  generating: boolean;
  progress: number;
  results: GenerationResult[];
  error: string | null;
  batch: number;
  startedAt: number | null;
};

interface Store {
  view: View;
  setView: (v: View) => void;
  activeNav: NavKey;
  setActiveNav: (v: NavKey) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  authOpen: boolean;
  authMode: 'login' | 'register';
  openAuth: (mode?: 'login' | 'register') => void;
  closeAuth: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;

  prompt: string;
  setPrompt: (p: string) => void;
  ratio: AspectRatio;
  setRatio: (r: AspectRatio) => void;
  style: string;
  setStyle: (s: string) => void;
  referenceUrl: string;
  setReferenceUrl: (url: string) => void;

  works: GenerationResult[];
  addWorks: (items: GenerationResult[]) => void;
  removeWork: (id: string) => void;
  generation: GenerationJob;
  startGeneration: (request: GenerationRequest) => Promise<void>;
  setGenerationError: (message: string | null) => void;

  remix: (seed: RemixSeed) => void;
  pendingRemix: number; // increments to trigger scroll/focus
}

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('home');
  const [activeNav, setActiveNav] = useState<NavKey>('home');
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<AppUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [prompt, setPrompt] = useState(
    '一款透明玻璃质感的智能耳机悬浮在柔和浅灰背景中，内部结构若隐若现，摄影棚柔光，金属边缘高光，商业产品海报，画面干净高级'
  );
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [style, setStyle] = useState('cinematic');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [works, setWorks] = useState<GenerationResult[]>([]);
  const [generation, setGeneration] = useState<GenerationJob>({
    generating: false,
    progress: 0,
    results: [],
    error: null,
    batch: 1,
    startedAt: null,
  });
  const [pendingRemix, setPendingRemix] = useState(0);
  const generationRunningRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addWorks = useCallback((items: GenerationResult[]) => {
    setWorks((cur) => [...items, ...cur]);
  }, []);

  const setGenerationError = useCallback((message: string | null) => {
    setGeneration((cur) => ({ ...cur, error: message }));
  }, []);

  const openAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
  }, []);

  const startGeneration = useCallback(async (request: GenerationRequest) => {
    if (generationRunningRef.current) return;
    generationRunningRef.current = true;
    const batch = request.n ?? 1;
    const startedAt = Date.now();
    setGeneration({
      generating: true,
      progress: 0,
      results: [],
      error: null,
      batch,
      startedAt,
    });

    const ticker = window.setInterval(() => {
      setGeneration((cur) => ({
        ...cur,
        progress: cur.progress >= 92 ? cur.progress : cur.progress + 2 + Math.random() * 3,
      }));
    }, 140);

    try {
      const items = await generateImages(request);
      addWorks(items);
      setGeneration((cur) => ({
        ...cur,
        generating: false,
        progress: 100,
        results: items,
        error: null,
        batch,
        startedAt,
      }));
    } catch (error: any) {
      setGeneration((cur) => ({
        ...cur,
        generating: false,
        progress: 0,
        error: error?.message ?? 'Generation failed',
        batch,
        startedAt,
      }));
    } finally {
      window.clearInterval(ticker);
      generationRunningRef.current = false;
      window.setTimeout(() => {
        setGeneration((cur) => (cur.generating ? cur : { ...cur, progress: 0 }));
      }, 800);
    }
  }, [addWorks]);

  const removeWork = useCallback((id: string) => {
    setWorks((cur) => cur.filter((w) => w.id !== id));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const remix = useCallback((seed: RemixSeed) => {
    setPrompt(seed.prompt);
    if (seed.ratio) setRatio(seed.ratio);
    if (seed.style) setStyle(seed.style);
    setReferenceUrl(toAbsoluteImageUrl(seed.referenceUrl));
    setView('home');
    setActiveNav('home');
    setPendingRemix((n) => n + 1);
  }, []);

  return (
    <StoreCtx.Provider
      value={{
        view, setView, activeNav, setActiveNav, theme, toggleTheme, user, setUser,
        authOpen, authMode, openAuth, closeAuth, setAuthMode,
        prompt, setPrompt, ratio, setRatio, style, setStyle, referenceUrl, setReferenceUrl,
        works, addWorks, removeWork, generation, startGeneration, setGenerationError,
        remix, pendingRemix,
      }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
