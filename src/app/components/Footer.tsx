import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 mt-10">
      <div className="max-w-[1440px] mx-auto px-8 py-12 grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-10">
        <div>
          <Logo />
          <p className="text-white/45 mt-4 max-w-[320px]" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            ImageNova AI — A futuristic creative community powered by GPT-image2.
            释放每个创作者的想象力。
          </p>
          <div className="flex items-center gap-2 mt-5">
            <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#a78bfa' }}>
              v2.4.1 · Nova Engine
            </span>
            <span className="glass rounded-md px-2 py-1 flex items-center gap-1" style={{ fontSize: 10 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All systems operational
            </span>
          </div>
        </div>
        {[
          { t: 'Product', cn: '产品', items: ['Generate', 'Public Gallery', 'Prompts', 'My Works', 'API'] },
          { t: 'Community', cn: '社区', items: ['Discord', 'Twitter / X', '小红书', 'B 站', 'Showcase'] },
          { t: 'Company', cn: '关于', items: ['About', 'Careers', 'Press', 'Blog', 'Contact'] },
          { t: 'Legal', cn: '法律', items: ['Terms', 'Privacy', 'Copyright', 'Cookies', 'AUP'] },
        ].map((col) => (
          <div key={col.t}>
            <div className="flex items-baseline gap-2 mb-4">
              <span style={{ fontSize: 13, fontWeight: 600 }}>{col.t}</span>
              <span className="text-white/35" style={{ fontSize: 10.5 }}>{col.cn}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {col.items.map((i) => (
                <a key={i} href="#" className="text-white/55 hover:text-white transition" style={{ fontSize: 12 }}>{i}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-5 px-8 max-w-[1440px] mx-auto flex items-center justify-between text-white/35" style={{ fontSize: 11.5 }}>
        <span>© 2026 ImageNova AI · 上海星云智能科技有限公司</span>
        <span style={{ fontFamily: 'JetBrains Mono' }}>Made with ❤︎ in Shanghai · Built for creators</span>
      </div>
    </footer>
  );
}
