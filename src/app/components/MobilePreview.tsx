import { Sparkles, Search, Heart, Home, User, Compass, Send, Wand2, Cpu, Bell } from 'lucide-react';

const mobileGallery = [
  { url: '/assets/showcase/1776658772018-lukyfw-hgsufldbiaeimwz-b0eb3f27.jpg', h: 180 },
  { url: '/assets/showcase/1776662673014-nf0taw-hgrmndybsaagg88-72e7da42.jpg', h: 120 },
  { url: '/assets/showcase/1776756799880-c8u8w7-hgukjjaasaavvra-a99be45a.jpg', h: 200 },
  { url: '/assets/showcase/1778921891612-x61gjv-hix-aadakaqoycj-dd3480e1.jpg', h: 150 },
];

function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[390px] h-[800px] rounded-[48px] p-[10px]" style={{ background: 'linear-gradient(180deg, #1a1830, #0a0816)', boxShadow: '0 40px 80px -20px rgba(139,92,246,0.4), 0 0 0 1px rgba(255,255,255,0.08)' }}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-black z-10" />
        <div className="w-full h-full rounded-[40px] overflow-hidden relative noise-bg" style={{ background: 'radial-gradient(circle at 20% 0%, #1d1640, #07060f 60%)' }}>
          {children}
        </div>
      </div>
      <span className="text-white/55" style={{ fontSize: 12.5, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
}

export function MobilePreview() {
  return (
    <section className="relative max-w-[1440px] mx-auto px-8 pb-24 hidden lg:block">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-sky-400 to-violet-500" />
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#60a5fa', letterSpacing: '0.15em' }}>
            移动端预览
          </span>
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 700 }}>
          在 <span className="text-gradient">不同设备</span> 上都好看
        </h2>
        <p className="text-white/55 mt-2" style={{ fontSize: 14 }}>响应式设计 · 390px 关键页面布局</p>
      </div>

      <div className="grid grid-cols-3 gap-10 justify-items-center">
        {/* Phone 1 - Home / Generate */}
        <Phone label="01 · 创作页">
          <div className="pt-12 px-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.1em' }}>NOVA</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk' }}>创作</div>
              </div>
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-xl glass flex items-center justify-center"><Bell size={14} /></button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center" style={{ fontSize: 11, fontWeight: 600 }}>NK</div>
              </div>
            </div>
            <div className="glass rounded-full px-3 py-2 flex items-center gap-2 mb-4" style={{ fontSize: 11 }}>
              <Cpu size={12} className="text-violet-300" />
              <span style={{ fontFamily: 'JetBrains Mono', color: '#f472b6' }}>GPT-image2</span>
              <span className="text-white/40 ml-auto">v2.4</span>
            </div>

            <div className="rounded-2xl p-[1.5px] bg-gradient-to-r from-violet-500/40 to-pink-500/40 mb-3">
              <div className="rounded-2xl bg-[#0c0a1f]/90 p-3.5" style={{ fontSize: 12, lineHeight: 1.5 }}>
                <div className="text-white/85">未来城市中的赛博朋克少女，电影级光影...</div>
                <div className="text-white/30 mt-2" style={{ fontSize: 10 }}>23 字</div>
              </div>
            </div>

            <div className="flex gap-1.5 mb-3 flex-wrap">
              {['1:1', '16:9', '9:16', '4:3'].map((r, i) => (
                <button key={r} className={`glass rounded-lg px-2.5 py-1 ${i === 0 ? 'chip-active' : ''}`} style={{ fontSize: 10.5 }}>{r}</button>
              ))}
            </div>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {['电影感', '动漫', '赛博', '+5'].map((s, i) => (
                <button key={s} className={`glass rounded-full px-2.5 py-1 ${i === 0 ? 'chip-active' : ''}`} style={{ fontSize: 10.5 }}>{s}</button>
              ))}
            </div>

            <button className="btn-glow w-full rounded-2xl py-3 flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
              <Sparkles size={14} /> 立即生成 <Send size={12} />
            </button>

            {/* progress */}
            <div className="glass rounded-xl p-3 mt-3">
              <div className="flex items-center justify-between mb-2" style={{ fontSize: 11 }}>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />生成中...</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f472b6' }}>42%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full shimmer-bar rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 - Gallery */}
        <Phone label="02 · 图库">
          <div className="pt-12 px-5">
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk' }}>图库</div>
              <button className="w-9 h-9 rounded-xl glass flex items-center justify-center"><Search size={14} /></button>
            </div>
            <div className="flex gap-1.5 mb-4 overflow-hidden">
              {['热门', '最新', '动漫', '赛博', '写实'].map((f, i) => (
                <button key={f} className={`glass rounded-full px-3 py-1 shrink-0 ${i === 0 ? 'chip-active' : ''}`} style={{ fontSize: 11 }}>{f}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mobileGallery.map((g, i) => (
                <div key={i} className="rounded-xl overflow-hidden relative glass-strong" style={{ height: g.h }}>
                  <img src={g.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between" style={{ fontSize: 9 }}>
                    <span className="flex items-center gap-1"><Heart size={9} className="text-pink-400" /> 2.4k</span>
                    <span className="glass rounded px-1 py-0.5" style={{ fontFamily: 'JetBrains Mono' }}>{i % 2 ? '3:4' : '1:1'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Phone>

        {/* Phone 3 - Detail */}
        <Phone label="03 · 详情">
          <div className="pt-12 px-5">
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#a78bfa' }}>← 返回</div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#a78bfa' }}>分享</div>
            </div>
            <div className="rounded-2xl overflow-hidden mb-3 relative">
              <img src="/assets/showcase/1776699445498-ga2ry5-hgo7h0dwkaapdkk-ab96ec6c.jpg" className="w-full h-[280px] object-cover" />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="glass rounded-md px-1.5 py-0.5" style={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}>3:4</span>
                <span className="glass rounded-md px-1.5 py-0.5 flex items-center gap-1" style={{ fontSize: 9 }}><Cpu size={9} />GPT-image2</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center" style={{ fontSize: 10, fontWeight: 600 }}>M</div>
              <div className="min-w-0">
                <div style={{ fontSize: 12, fontWeight: 500 }}>@mira.q</div>
                <div className="text-white/40" style={{ fontSize: 10 }}>2026-05-13 · 14:32</div>
              </div>
              <button className="ml-auto glass rounded-lg px-2.5 py-1" style={{ fontSize: 10.5 }}>关注</button>
            </div>
            <div className="glass rounded-xl p-3 mb-3" style={{ fontSize: 11, lineHeight: 1.5, fontFamily: 'JetBrains Mono' }}>
              <div className="text-white/45 mb-1.5" style={{ fontSize: 10 }}>提示词</div>
              红蓝光影下的人像摄影，时尚杂志质感，真实皮肤纹理...
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-glow rounded-xl py-2.5 flex items-center justify-center gap-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
                <Wand2 size={12} /> 二次创作
              </button>
              <button className="glass rounded-xl py-2.5 flex items-center justify-center gap-1.5" style={{ fontSize: 12 }}>
                <Heart size={12} className="text-pink-400" /> 5.2k
              </button>
            </div>
          </div>
          {/* Bottom nav */}
          <div className="absolute bottom-3 left-3 right-3 glass-strong rounded-2xl py-2.5 flex items-center justify-around">
            {[Home, Compass, Sparkles, Heart, User].map((Icon, i) => (
              <button key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 2 ? 'btn-glow' : ''}`}>
                <Icon size={15} className={i === 2 ? '' : 'text-white/60'} />
              </button>
            ))}
          </div>
        </Phone>
      </div>
    </section>
  );
}
