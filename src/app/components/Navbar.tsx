import { Bell, ChevronDown, Sparkles, Crown, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { useStore, View } from '../lib/store';
import { getModels, getNotifications } from '../lib/imageApi';

const navItems: { id: View | 'gallery' | 'prompts' | 'pro'; en: string; cn: string }[] = [
  { id: 'home', en: 'Generate', cn: '生成图片' },
  { id: 'gallery', en: 'Gallery', cn: '公共图库' },
  { id: 'prompts', en: 'Prompts', cn: '提示词广场' },
  { id: 'works', en: 'My Works', cn: '我的作品' },
  { id: 'pro', en: 'Pro', cn: '会员中心' },
];

export function Navbar() {
  const { view, setView, theme, toggleTheme } = useStore();
  const [model, setModel] = useState('GPT-image2');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getModels().then((data) => setModel(data.selected)).catch(() => {});
    getNotifications().then((data) => setUnread(data.items.filter((item) => !item.read).length)).catch(() => {});
  }, []);

  const handleClick = (id: string) => {
    if (id === 'home' || id === 'works') setView(id as View);
    else {
      setView('home');
      requestAnimationFrame(() => {
        const map: Record<string, string> = { gallery: 'gallery-section', prompts: 'prompts-section', pro: 'pro-section' };
        document.getElementById(map[id])?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  const isActive = (id: string) => (id === 'home' && view === 'home') || (id === 'works' && view === 'works');

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 glass-strong border-b border-white/10" />
      <div className="relative max-w-[1440px] mx-auto h-[68px] px-8 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button onClick={() => setView('home')} className="cursor-pointer"><Logo /></button>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`group relative px-3.5 py-2 rounded-xl transition-all ${active ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <span className={active ? 'text-white' : 'text-white/70 group-hover:text-white'}>
                    {item.en}
                  </span>
                  <span className="ml-1.5 text-white/30" style={{ fontSize: 11 }}>{item.cn}</span>
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-violet-400 to-pink-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 glass rounded-xl px-3 py-2 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="text-white/60">Model</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#a78bfa' }}>{model}</span>
            <ChevronDown size={13} className="text-white/40" />
          </button>

          <button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/8 transition"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-300" /> : <Moon size={16} className="text-violet-500" />}
          </button>

          <button className="relative w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/8 transition">
            <Bell size={16} className="text-white/70" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-[#07060f]" />}
          </button>

          <div className="w-px h-7 bg-white/10" />

          <button className="btn-glow rounded-xl px-4 py-2 flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
            <Crown size={14} />
            <span>Upgrade</span>
          </button>

          <div className="relative">
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400">
              <div className="w-full h-full rounded-full bg-[#1a1830] flex items-center justify-center" style={{ fontWeight: 600, fontSize: 13 }}>
                NK
              </div>
            </div>
            <Sparkles size={10} className="absolute -bottom-0.5 -right-0.5 text-amber-300" />
          </div>
        </div>
      </div>
    </header>
  );
}
