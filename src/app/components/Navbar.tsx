import { Bell, ChevronDown, Sparkles, Crown, Sun, Moon, LogOut, UserRound, X, Home, Compass, Images, BookOpen } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { NavKey, useStore, View } from '../lib/store';
import { getMe, getModels, getNotifications, login, logout, register } from '../lib/imageApi';

const navItems: { id: NavKey; label: string }[] = [
  { id: 'home', label: '生成图片' },
  { id: 'gallery', label: '公共图库' },
  { id: 'prompts', label: '提示词广场' },
  { id: 'works', label: '我的作品' },
  { id: 'pro', label: '会员中心' },
];

export function Navbar() {
  const { view, setView, activeNav, setActiveNav, theme, toggleTheme, user, setUser } = useStore();
  const [model, setModel] = useState('GPT-image2');
  const [unread, setUnread] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const keepAnchorActiveUntil = useRef(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getModels().then((data) => setModel(data.selected)).catch(() => {});
    getNotifications().then((data) => setUnread(data.items.filter((item) => !item.read).length)).catch(() => {});
    getMe().then((data) => setUser(data.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (view !== 'home') {
      setActiveNav(view === 'works' ? 'works' : 'prompts');
      return;
    }

    const sections: Array<{ id: string; key: NavKey }> = [
      { id: 'gallery-section', key: 'gallery' },
      { id: 'prompts-section', key: 'prompts' },
      { id: 'pro-section', key: 'pro' },
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = sections.find((section) => section.id === visible.target.id);
        if (match) setActiveNav(match.key);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.2, 0.45, 0.7] },
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    const onScroll = () => {
      if (window.scrollY < 240 && Date.now() > keepAnchorActiveUntil.current) setActiveNav('home');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [view, setActiveNav]);

  const handleClick = (id: NavKey) => {
    setActiveNav(id);
    if (id === 'home' || id === 'works' || id === 'prompts') {
      keepAnchorActiveUntil.current = 0;
      setView(id as View);
      if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
      else requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    } else {
      keepAnchorActiveUntil.current = Date.now() + 1200;
      const map: Record<string, string> = { gallery: 'gallery-section', prompts: 'prompts-section', pro: 'pro-section' };
      const scroll = () => document.getElementById(map[id])?.scrollIntoView({ behavior: 'smooth' });
      if (view !== 'home') {
        setView('home');
        requestAnimationFrame(() => requestAnimationFrame(scroll));
      } else {
        scroll();
      }
    }
  };

  const isActive = (id: NavKey) => activeNav === id;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 glass-strong border-b border-white/10" />
      <div className="relative max-w-[1440px] mx-auto h-[64px] md:h-[68px] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-10">
          <button onClick={() => { setActiveNav('home'); setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="cursor-pointer"><Logo /></button>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`group relative whitespace-nowrap px-4 py-2 rounded-xl transition-all ${active ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  <span className={active ? 'text-white' : 'text-white/70 group-hover:text-white'}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-violet-400 to-pink-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-2 hover:bg-white/8 transition whitespace-nowrap" style={{ fontSize: 12 }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="text-white/60">模型</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#a78bfa' }}>{model}</span>
            <ChevronDown size={13} className="text-white/40" />
          </button>

          <button
            onClick={toggleTheme}
            className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl glass flex items-center justify-center hover:bg-white/8 transition"
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-300" /> : <Moon size={16} className="text-violet-500" />}
          </button>

          <button className="relative hidden sm:flex w-10 h-10 rounded-xl glass items-center justify-center hover:bg-white/8 transition">
            <Bell size={16} className="text-white/70" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-[#07060f]" />}
          </button>

          <div className="hidden md:block w-px h-7 bg-white/10" />

          <button className="hidden md:flex btn-glow rounded-xl px-4 py-2 items-center gap-1.5 whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600 }}>
            <Crown size={14} />
            <span>升级会员</span>
          </button>

          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="relative block"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full p-[2px] bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400">
                  <div className="w-full h-full rounded-full bg-[#1a1830] flex items-center justify-center" style={{ fontWeight: 600, fontSize: 13 }}>
                    {user.avatar}
                  </div>
                </div>
                <Sparkles size={10} className="absolute -bottom-0.5 -right-0.5 text-amber-300" />
              </button>
              {userMenuOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl glass-strong border border-white/10 p-3">
                <div className="mb-3">
                  <div className="text-white/90" style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                  <div className="text-white/40 truncate" style={{ fontSize: 11 }}>{user.email}</div>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-white/5 p-2">
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.plan === 'pro' ? '会员' : '免费'}</div>
                    <div className="text-white/35" style={{ fontSize: 10 }}>套餐</div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.quota.usedThisMonth}/{user.quota.monthlyLimit}</div>
                    <div className="text-white/35" style={{ fontSize: 10 }}>用量</div>
                  </div>
                </div>
                <button
                  onClick={async () => { await logout(); setUser(null); setUserMenuOpen(false); }}
                  className="w-full rounded-xl px-3 py-2 text-left text-white/65 hover:bg-white/8 flex items-center gap-2"
                  style={{ fontSize: 12 }}
                >
                  <LogOut size={13} /> 退出登录
                </button>
              </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
              className="glass rounded-xl px-3 md:px-4 py-2 flex items-center gap-2 hover:bg-white/8 whitespace-nowrap"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <UserRound size={14} /> 登录
            </button>
          )}
        </div>
      </div>
      {authOpen && (
        <AuthDialog
          mode={authMode}
          onMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onAuthed={(nextUser) => { setUser(nextUser); setAuthOpen(false); }}
        />
      )}
      <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden glass-strong rounded-2xl px-2 py-2 flex items-center justify-around border border-white/10">
        {[
          { id: 'home' as NavKey, icon: Home, label: '生成' },
          { id: 'gallery' as NavKey, icon: Compass, label: '图库' },
          { id: 'prompts' as NavKey, icon: BookOpen, label: '提示词' },
          { id: 'works' as NavKey, icon: Images, label: '作品' },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`h-11 min-w-14 rounded-xl flex flex-col items-center justify-center gap-0.5 ${active ? 'btn-glow' : 'text-white/55'}`}
              style={{ fontSize: 10.5 }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function AuthDialog({
  mode,
  onMode,
  onClose,
  onAuthed,
}: {
  mode: 'login' | 'register';
  onMode: (mode: 'login' | 'register') => void;
  onClose: () => void;
  onAuthed: (user: any) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(mode === 'login' ? 'demo@imagenova.local' : '');
  const [password, setPassword] = useState(mode === 'login' ? 'demo123456' : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);
      onAuthed(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-2xl glass-strong border border-white/10 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{mode === 'login' ? '登录账户' : '创建账户'}</div>
            <div className="text-white/45 mt-1" style={{ fontSize: 12 }}>登录后作品、点赞和收藏会归属到当前用户。</div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {mode === 'register' && (
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="昵称" className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:border-violet-300/60" />
          )}
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:border-violet-300/60" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="密码，至少 6 位" className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:border-violet-300/60" />
        </div>
        {error && <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-rose-200" style={{ fontSize: 12 }}>{error}</div>}
        <button disabled={saving} className="btn-glow mt-4 w-full rounded-xl py-3 disabled:opacity-60" style={{ fontSize: 14, fontWeight: 700 }}>
          {saving ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = mode === 'login' ? 'register' : 'login';
            onMode(next);
            setEmail(next === 'login' ? 'demo@imagenova.local' : '');
            setPassword(next === 'login' ? 'demo123456' : '');
          }}
          className="mt-3 w-full text-white/50 hover:text-white"
          style={{ fontSize: 12 }}
        >
          {mode === 'login' ? '没有账户？注册一个' : '已有账户？返回登录'}
        </button>
      </form>
    </div>
  );
}
