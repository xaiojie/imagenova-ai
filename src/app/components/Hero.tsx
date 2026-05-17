import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const heroImages = [
  { url: 'https://cms-assets.youmind.com/media/1776658772018_lukyfw_HGSUfldbIAEiMWZ.jpg', tag: 'Exploded View', x: 0, y: 30, rot: -6, w: 230, h: 270, delay: 0 },
  { url: 'https://cms-assets.youmind.com/media/1776699445498_ga2ry5_HGO7H0DWkAApdKK.jpg', tag: 'Live UI', x: 240, y: -10, rot: 4, w: 210, h: 290, delay: 0.8 },
  { url: 'https://cms-assets.youmind.com/media/1776662673014_nf0taw_HGRMNDybsAAGG88.jpg', tag: 'Map Infographic', x: 35, y: 320, rot: -3, w: 270, h: 170, delay: 1.4 },
  { url: 'https://cms-assets.youmind.com/media/1776756799880_c8u8w7_HGUKjjaasAAvVRa.jpg', tag: 'Anime Action', x: 320, y: 300, rot: 6, w: 170, h: 220, delay: 0.4 },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      {/* gradient orbs */}
      <div className="absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full animate-orb hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 60%)', filter: 'blur(60px)' }} />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full animate-orb hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.35), transparent 60%)', filter: 'blur(70px)', animationDelay: '4s' }} />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full animate-orb hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 60%)', filter: 'blur(60px)', animationDelay: '8s' }} />

      <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 pt-10 md:pt-20 pb-12 md:pb-24 grid grid-cols-1 md:grid-cols-[1fr_580px] gap-8 md:gap-12 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex max-w-full items-center gap-2 glass rounded-full px-3.5 py-1.5 mb-5 md:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="truncate" style={{ fontSize: 12, color: '#a78bfa', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>
              POWERED BY GPT-IMAGE2
            </span>
            <span className="text-white/40 hidden sm:inline" style={{ fontSize: 12 }}>· 全新 Nova Engine</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.02 }}>
            Create stunning <br />
            <span className="text-gradient">AI images</span> with <br />
            GPT-image2
          </h1>

          <p className="mt-5 md:mt-6 max-w-[480px] text-white/60" style={{ fontSize: 16, lineHeight: 1.6 }}>
            输入灵感，选择风格，一键生成专业级 AI 图像。<br />
            Craft cinematic visuals, character portraits, and dreamscapes — all in seconds.
          </p>

          <div className="mt-7 md:mt-9 grid grid-cols-1 sm:flex sm:items-center gap-3 md:gap-4">
            <button className="btn-glow rounded-2xl px-6 py-3.5 flex items-center justify-center gap-2" style={{ fontSize: 14, fontWeight: 600 }}>
              <Sparkles size={16} />
              Start Creating
              <ArrowRight size={15} />
            </button>
            <button className="glass rounded-2xl px-6 py-3.5 flex items-center justify-center gap-2 hover:bg-white/8 transition" style={{ fontSize: 14, fontWeight: 500 }}>
              <Compass size={16} className="text-white/70" />
              Explore Gallery
            </button>
          </div>

          <div className="mt-8 md:mt-12 grid grid-cols-3 gap-4 md:flex md:items-center md:gap-8">
            {[
              { v: '12.4M+', l: 'Images created' },
              { v: '184K', l: 'Active artists' },
              { v: '4.8s', l: 'Avg. render' },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-gradient" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{s.v}</div>
                <div className="text-white/40" style={{ fontSize: 12, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:hidden">
          {heroImages.map((img) => (
            <div key={img.tag} className="relative aspect-[4/5] rounded-2xl overflow-hidden glass-strong">
              <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 right-2 truncate glass rounded-md px-2 py-1 text-white/90" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>
                {img.tag}
              </span>
            </div>
          ))}
        </div>

        {/* Floating image stack */}
        <div className="relative h-[560px] hidden md:block">
          {heroImages.map((img, i) => (
            <motion.div
              key={i}
              className="absolute rounded-2xl overflow-hidden glass-strong"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.7 }}
              style={{
                left: img.x, top: img.y, width: img.w, height: img.h,
                transform: `rotate(${img.rot}deg)`,
                boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset',
                ['--r' as any]: `${img.rot}deg`,
                animation: `float-slow ${7 + i * 0.6}s ease-in-out ${img.delay}s infinite`,
              }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="glass rounded-md px-2 py-0.5 text-white/90" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>
                  {img.tag}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </motion.div>
          ))}
          {/* sparkle dots */}
          <div className="absolute top-10 right-10 w-1 h-1 rounded-full bg-white animate-pulse-soft" />
          <div className="absolute bottom-20 left-4 w-1.5 h-1.5 rounded-full bg-pink-300 animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-0 w-1 h-1 rounded-full bg-violet-300 animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </section>
  );
}
