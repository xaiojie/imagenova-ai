import { Zap, Lock, Layers, Image as ImageIcon, ArrowRight, Crown } from 'lucide-react';

const perks = [
  { icon: Zap, t: '极速渲染', d: '更高优先级的生成队列' },
  { icon: Lock, t: '私密图库', d: '作品默认仅自己可见' },
  { icon: ImageIcon, t: '高清导出', d: '支持高清图片下载' },
  { icon: Layers, t: '更多并发', d: '同时处理更多生成任务' },
];

export function UpgradeBanner() {
  return (
    <section id="pro-section" className="relative max-w-[1440px] mx-auto px-4 md:px-8 pb-14 md:pb-20">
      <div className="relative rounded-[22px] md:rounded-[28px] overflow-hidden noise-bg" style={{
        background: 'linear-gradient(135deg, #1a1235 0%, #2d1547 35%, #471a3e 70%, #1f2952 100%)',
      }}>
        {/* halo orbs */}
        <div className="absolute -top-32 -right-20 w-[520px] h-[520px] rounded-full animate-orb"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.45), transparent 60%)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-32 -left-20 w-[520px] h-[520px] rounded-full animate-orb"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.45), transparent 60%)', filter: 'blur(60px)', animationDelay: '5s' }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8 lg:gap-10 p-5 md:p-8 lg:p-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 mb-5">
              <Crown size={13} className="text-amber-300" />
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#fde68a', letterSpacing: '0.15em' }}>会员中心</span>
            </div>
            <h2 className="section-title" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.08 }}>
              解锁 <span className="text-gradient">更快生成</span> <br />
              和私密创作能力
            </h2>
            <p className="text-white/60 mt-4 max-w-[460px]" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
              释放 GPT-image2 的完整能力：更快的生成速度、私密图库、高清导出与更多并发任务。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
              {perks.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.t} className="glass rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.t}</span>
                      </div>
                      <div className="text-white/50 mt-0.5" style={{ fontSize: 11.5 }}>{p.d}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:flex sm:items-center gap-3 mt-7">
              <button className="btn-glow rounded-2xl px-6 py-3.5 flex items-center justify-center gap-2" style={{ fontSize: 14, fontWeight: 600 }}>
                <Crown size={15} /> 升级会员 <ArrowRight size={14} />
              </button>
              <span className="text-white/45" style={{ fontSize: 12.5 }}>
                ¥68 / 月 · 限时首月 ¥38 · 可随时取消
              </span>
            </div>
          </div>

          {/* price card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] opacity-50 blur-2xl" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.5), rgba(99,102,241,0.5))' }} />
            <div className="relative glass-strong rounded-[24px] p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-white/55" style={{ fontSize: 12 }}>月度会员</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-gradient" style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Space Grotesk' }}>¥38</span>
                    <span className="text-white/50" style={{ fontSize: 13 }}>/ 首月</span>
                  </div>
                  <div className="text-white/35 line-through" style={{ fontSize: 12 }}>之后 ¥68/月</div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fde68a, #f472b6)' }}>
                  <Crown size={20} className="text-black/80" />
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  '每月不限量生成',
                  '高清图片下载',
                  '私密图库与文件夹',
                  '优先生成队列',
                  '商业使用授权',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34d399, #6366f1)' }}>
                      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5"><path d="M2 6.5l2.5 2.5L10 3.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <span className="text-white/80" style={{ fontSize: 12.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between text-white/45" style={{ fontSize: 11 }}>
                <span>已有 18.4 万创作者使用</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>SOC2 · ISO27001</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
