import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { GenerationResult, AspectRatio } from './imageApi';

export type View = 'home' | 'works';
export type Theme = 'dark' | 'light';

type RemixSeed = {
  prompt: string;
  ratio?: AspectRatio;
  style?: string;
};

interface Store {
  view: View;
  setView: (v: View) => void;
  theme: Theme;
  toggleTheme: () => void;

  prompt: string;
  setPrompt: (p: string) => void;
  ratio: AspectRatio;
  setRatio: (r: AspectRatio) => void;
  style: string;
  setStyle: (s: string) => void;

  works: GenerationResult[];
  addWorks: (items: GenerationResult[]) => void;
  removeWork: (id: string) => void;

  remix: (seed: RemixSeed) => void;
  pendingRemix: number; // increments to trigger scroll/focus
}

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('home');
  const [theme, setTheme] = useState<Theme>('dark');
  const [prompt, setPrompt] = useState(
    '未来城市中的赛博朋克少女，霓虹反射，电影级光影，超高细节，胶片颗粒，35mm 镜头'
  );
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [style, setStyle] = useState('cinematic');
  const [works, setWorks] = useState<GenerationResult[]>([]);
  const [pendingRemix, setPendingRemix] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addWorks = useCallback((items: GenerationResult[]) => {
    setWorks((cur) => [...items, ...cur]);
  }, []);

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
    setView('home');
    setPendingRemix((n) => n + 1);
  }, []);

  return (
    <StoreCtx.Provider
      value={{
        view, setView, theme, toggleTheme,
        prompt, setPrompt, ratio, setRatio, style, setStyle,
        works, addWorks, removeWork,
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
