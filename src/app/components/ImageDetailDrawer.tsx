import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Bookmark, Copy, Download, Wand2, Share2, Cpu, Calendar, Aperture } from 'lucide-react';
import type { GalleryItem } from './Gallery';
import { useStore } from '../lib/store';
import { imageAction, imageDownloadUrl } from '../lib/imageApi';
import type { AspectRatio } from '../lib/imageApi';

export function ImageDetailDrawer({ item, onClose }: { item: GalleryItem | null; onClose: () => void }) {
  const { remix } = useStore();
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-[560px] z-[70] glass-strong border-l border-white/10 overflow-y-auto noise-bg"
          >
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0816]/60 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.15em' }}>IMAGE DETAIL</span>
                <span className="text-white/30">·</span>
                <span className="text-white/50" style={{ fontSize: 11 }}>#{item.id.toUpperCase()}</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl overflow-hidden mb-5 relative">
                <img src={item.url} className="w-full" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>{item.ratio}</span>
                  <span className="glass rounded-md px-2 py-1 flex items-center gap-1" style={{ fontSize: 10 }}>
                    <Cpu size={10} className="text-violet-300" /> GPT-image2
                  </span>
                </div>
              </div>

              {/* author */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-violet-500 to-pink-500">
                    <div className="w-full h-full rounded-full bg-[#1a1830] flex items-center justify-center" style={{ fontWeight: 600 }}>
                      {item.avatar}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>@{item.user}</div>
                    <div className="text-white/45 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                      <Calendar size={10} /> {item.createdAt ? new Date(item.createdAt).toLocaleString() : '2026-05-13 · 14:32'}
                    </div>
                  </div>
                </div>
                <button className="glass rounded-xl px-3 py-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
                  Follow · 关注
                </button>
              </div>

              {/* prompt block */}
              <div className="glass rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70" style={{ fontSize: 12, fontWeight: 500 }}>Full Prompt · 完整提示词</span>
                  <button onClick={() => { imageAction(item.id, 'copy'); navigator.clipboard?.writeText(item.prompt); }} className="text-violet-300 flex items-center gap-1 hover:text-pink-300 transition" style={{ fontSize: 11 }}>
                    <Copy size={11} /> Copy
                  </button>
                </div>
                <p className="text-white/85" style={{ fontSize: 13, lineHeight: 1.65, fontFamily: 'JetBrains Mono' }}>
                    {item.prompt}
                </p>
              </div>

              {/* meta grid */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { l: 'Model', v: 'GPT-image2', icon: Cpu },
                  { l: 'Aspect', v: item.ratio, icon: Aperture },
                  { l: 'Seed', v: String(item.seed ?? '982134'), icon: () => <span style={{ fontFamily: 'JetBrains Mono' }}>#</span> },
                  { l: 'Quality', v: item.quality ?? 'Ultra' },
                  { l: 'Creativity', v: String(item.creativity ?? '7.5') },
                  { l: 'Steps', v: String(item.steps ?? '42') },
                ].map((m: any) => (
                  <div key={m.l} className="glass rounded-xl p-3">
                    <div className="text-white/40 mb-1" style={{ fontSize: 10 }}>{m.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: m.l === 'Seed' ? 'JetBrains Mono' : 'inherit' }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => { remix({ prompt: item.prompt, ratio: item.ratio as AspectRatio }); onClose(); }}
                  className="btn-glow rounded-xl py-3 flex items-center justify-center gap-2"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  <Wand2 size={14} /> Remix · 二次创作
                </button>
                <a href={imageDownloadUrl(item.id)} className="glass rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-white/8 transition" style={{ fontSize: 13 }}>
                  <Download size={14} /> Download HD
                </a>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => imageAction(item.id, 'like')} className="glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
                  <Heart size={12} className="text-pink-400" /> {item.likes}
                </button>
                <button onClick={() => imageAction(item.id, 'save')} className="glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
                  <Bookmark size={12} className="text-violet-300" /> {item.saves}
                </button>
                <button onClick={() => imageAction(item.id, 'share')} className="glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
                  <Share2 size={12} /> Share
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
