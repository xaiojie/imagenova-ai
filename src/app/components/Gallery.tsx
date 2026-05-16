import { motion } from 'motion/react';
import { Heart, Bookmark, Copy, Eye, Wand2, MoreHorizontal, Filter, Flame, Clock, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { getGallery, imageAction } from '../lib/imageApi';
import type { AspectRatio, GenerationResult } from '../lib/imageApi';

export type GalleryItem = {
  id: string;
  url: string;
  prompt: string;
  user: string;
  avatar: string;
  ratio: string;
  likes: number;
  saves: number;
  h: number; // visual height span
} & Partial<GenerationResult>;

export const galleryItems: GalleryItem[] = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1664267665561-24e5c5af0645?w=800&q=80', prompt: 'Cyberpunk woman with neon reflections, cinematic, 35mm film grain, ultra detailed, volumetric light', user: 'aurora.li', avatar: 'A', ratio: '3:4', likes: 2840, saves: 412, h: 420 },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1766342088275-c3081723881f?w=800&q=80', prompt: 'Abstract liquid dreamscape, iridescent waves, surreal painterly style', user: 'noctis_studio', avatar: 'N', ratio: '16:9', likes: 1923, saves: 287, h: 240 },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1675733540715-be9e6444c658?w=800&q=80', prompt: 'Portrait bathed in red and blue light, editorial fashion photography, soft skin', user: 'mira.q', avatar: 'M', ratio: '3:4', likes: 5210, saves: 891, h: 460 },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1774391048185-f947203cf6c0?w=800&q=80', prompt: 'Liquid metal sculpture, soft studio lighting, abstract concept render', user: 'kai.render', avatar: 'K', ratio: '9:16', likes: 3104, saves: 502, h: 500 },
  { id: 'g5', url: 'https://images.unsplash.com/photo-1761075665827-bf5282094678?w=800&q=80', prompt: 'Neon line geometry, futurist grid, glitch core aesthetic, dark theme', user: 'pixel.dust', avatar: 'P', ratio: '16:9', likes: 1521, saves: 198, h: 260 },
  { id: 'g6', url: 'https://images.unsplash.com/photo-1668608380298-00f7fbb572d3?w=800&q=80', prompt: 'Pink-haired character close-up, hyperreal skin, cinematic anime lighting', user: 'sienna.r', avatar: 'S', ratio: '3:4', likes: 6912, saves: 1240, h: 440 },
  { id: 'g7', url: 'https://images.unsplash.com/photo-1748483720632-9d385e40c331?w=800&q=80', prompt: 'A single strawberry on striped blue backdrop, soft pastel product shot', user: 'olive.s', avatar: 'O', ratio: '9:16', likes: 980, saves: 142, h: 500 },
  { id: 'g8', url: 'https://images.unsplash.com/photo-1761942407242-bec5f94898e2?w=800&q=80', prompt: 'A surreal portal in a stormy field, cinematic concept art', user: 'aeon.fx', avatar: 'A', ratio: '1:1', likes: 4205, saves: 612, h: 380 },
  { id: 'g9', url: 'https://images.unsplash.com/photo-1614249102574-94b6b58d02ee?w=800&q=80', prompt: 'Woman in green face paint, editorial macro portrait, fashion magazine', user: 'verde.studio', avatar: 'V', ratio: '3:4', likes: 2110, saves: 333, h: 430 },
  { id: 'g10', url: 'https://images.unsplash.com/photo-1559765431-47b1e9725cee?w=800&q=80', prompt: 'Hooded woman in shadow, moody noir lighting, cinematic high contrast', user: 'kuro.lens', avatar: 'K', ratio: '9:16', likes: 3678, saves: 502, h: 480 },
  { id: 'g11', url: 'https://images.unsplash.com/photo-1766430032829-7690d470b2ba?w=800&q=80', prompt: 'Purple and teal abstract flow, ethereal digital art, vaporwave dream', user: 'lumen.io', avatar: 'L', ratio: '16:9', likes: 1450, saves: 220, h: 250 },
  { id: 'g12', url: 'https://images.unsplash.com/photo-1768609956823-f92a042eb320?w=800&q=80', prompt: 'Woman holding burning paper at night, cinematic moody portrait, fire glow', user: 'ember.ai', avatar: 'E', ratio: '3:4', likes: 5089, saves: 712, h: 450 },
];

const filters = [
  { label: 'Trending', cn: '热门', icon: Flame, active: true },
  { label: 'Latest', cn: '最新', icon: Clock },
  { label: 'Rising', cn: '上升', icon: TrendingUp },
];

export function Gallery({ onOpen }: { onOpen: (item: GalleryItem) => void }) {
  const [active, setActive] = useState('Trending');
  const [items, setItems] = useState<GalleryItem[]>(galleryItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const { remix } = useStore();

  const loadGallery = async (nextPage: number, replace = false) => {
    const sort = active === 'Latest' ? 'recent' : active === 'Rising' ? 'rising' : 'trending';
    setLoading(true);
    return getGallery({ sort, page: nextPage, pageSize: 12 })
      .then((data) => {
        const mapped = data.items.map((item, index) => ({
          ...item,
          user: item.author?.user || 'creator',
          avatar: item.author?.avatar || 'C',
          likes: item.likes ?? 0,
          saves: item.saves ?? 0,
          h: [420, 260, 460, 500, 300, 440][index % 6],
        }));
        setItems((cur) => replace ? mapped : [...cur, ...mapped]);
        setPage(data.page);
        setHasMore(data.hasMore);
      })
      .catch(() => {
        if (replace) setItems(galleryItems);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    loadGallery(1, true);
  }, [active]);

  // Distribute into 4 columns for masonry feel
  const cols: GalleryItem[][] = [[], [], [], []];
  items.forEach((it, i) => cols[i % 4].push(it));

  return (
    <section id="gallery-section" className="relative max-w-[1440px] mx-auto px-8 pb-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-pink-400" />
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.15em' }}>
              PUBLIC GALLERY · 公共图库
            </span>
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 700 }}>
            Explore images generated by <span className="text-gradient">creators</span> worldwide
          </h2>
          <p className="text-white/55 mt-2" style={{ fontSize: 14 }}>
            围观全球创作者们用 GPT-image2 生成的精彩作品 · Click any image to view prompt & remix
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = active === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActive(f.label)}
                className={`glass rounded-xl px-3.5 py-2 flex items-center gap-2 hover:bg-white/8 transition ${isActive ? 'chip-active' : ''}`}
                style={{ fontSize: 12.5 }}
              >
                <Icon size={13} className={isActive ? 'text-pink-300' : 'text-white/55'} />
                <span>{f.label}</span>
                <span className="text-white/40">{f.cn}</span>
              </button>
            );
          })}
          <button className="glass rounded-xl px-3.5 py-2 flex items-center gap-2 hover:bg-white/8 transition" style={{ fontSize: 12.5 }}>
            <Filter size={13} className="text-white/55" /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-5">
            {col.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: (ci * 0.06) + (i * 0.08), duration: 0.6, ease: 'easeOut' }}
                whileHover={{ y: -6 }}
                onClick={() => onOpen(item)}
                className="group relative rounded-2xl overflow-hidden glass-strong cursor-pointer text-left"
                style={{ height: item.h }}
              >
                <img src={item.url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 opacity-90" />

                {/* top labels */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="glass rounded-md px-2 py-0.5 text-white/90 flex items-center gap-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {item.ratio}
                  </span>
                  <button className="w-7 h-7 rounded-lg glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <MoreHorizontal size={13} />
                  </button>
                </div>

                {/* hover overlay actions */}
                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <span className="glass-strong rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                    <Eye size={13} /> Detail
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); remix({ prompt: item.prompt, ratio: item.ratio as AspectRatio }); }}
                    className="rounded-xl px-3 py-2 flex items-center gap-1.5 btn-glow"
                    style={{ fontSize: 12 }}
                  >
                    <Wand2 size={13} /> Remix
                  </span>
                </div>

                {/* bottom area */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="text-white/85 line-clamp-2 mb-2.5" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0" style={{ fontSize: 10, fontWeight: 600 }}>
                        {item.avatar}
                      </div>
                      <span className="text-white/85 truncate" style={{ fontSize: 11.5 }}>{item.user}</span>
                      <span className="text-white/40 shrink-0" style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono' }}>GPT-image2</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-white/70" style={{ fontSize: 11 }}>
                        <Heart size={11} className="text-pink-400" /> {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                      </span>
                      <span className="flex items-center gap-1 text-white/70" style={{ fontSize: 11 }}>
                    <Bookmark size={11} className="text-violet-300" /> {item.saves}
                  </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); imageAction(item.id, 'copy'); navigator.clipboard?.writeText(item.prompt); }}
                        className="w-6 h-6 rounded-md glass flex items-center justify-center hover:bg-white/15 transition"
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={() => hasMore && loadGallery(page + 1)}
          disabled={!hasMore || loading}
          className="glass rounded-2xl px-6 py-3 flex items-center gap-2 hover:bg-white/8 transition disabled:opacity-50"
          style={{ fontSize: 13 }}
        >
          {loading ? 'Loading...' : hasMore ? 'Load more · 加载更多' : 'No more · 已加载完'}
          <span style={{ fontFamily: 'JetBrains Mono', color: '#a78bfa', fontSize: 11 }}>+12</span>
        </button>
      </div>
    </section>
  );
}
