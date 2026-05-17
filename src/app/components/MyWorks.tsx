import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2, Download, Trash2, Copy, Heart, Bookmark, Filter,
  Sparkles, Grid3x3, LayoutGrid, Lock, Globe2, Clock, ArrowRight, ImageIcon,
  Cpu, X, Calendar, Aperture,
} from 'lucide-react';
import { useStore } from '../lib/store';
import {
  GenerationResult, AspectRatio, getWorks, deleteWork, imageAction, imageDownloadUrl,
} from '../lib/imageApi';

const DEMO_SEEDS: GenerationResult[] = [
  { id: 'demo-1', url: 'https://cms-assets.youmind.com/media/1776658772018_lukyfw_HGSUfldbIAEiMWZ.jpg', prompt: '高科技 VR 头显爆炸视图海报，包含详细组件标注和宣传文案。', ratio: '16:9', model: 'GPT-image2', createdAt: Date.now() - 1000 * 60 * 60 * 2, seed: 102934, quality: 'ultra', style: '3d', source: 'mock' },
  { id: 'demo-2', url: 'https://cms-assets.youmind.com/media/1776662673014_nf0taw_HGRMNDybsAAGG88.jpg', prompt: '手绘水彩城市美食地图，包含编号美食、地标建筑和图例。', ratio: '16:9', model: 'GPT-image2', createdAt: Date.now() - 1000 * 60 * 60 * 8, seed: 882211, quality: 'ultra', style: 'ink', source: 'mock' },
  { id: 'demo-3', url: 'https://cms-assets.youmind.com/media/1776699445498_ga2ry5_HGO7H0DWkAApdKK.jpg', prompt: '电商直播 UI 样机，叠加聊天、礼物弹窗和商品购买卡片。', ratio: '9:16', model: 'GPT-image2', createdAt: Date.now() - 1000 * 60 * 60 * 26, seed: 442019, quality: 'ultra', style: 'product', source: 'mock' },
  { id: 'demo-4', url: 'https://cms-assets.youmind.com/media/1776756799880_c8u8w7_HGUKjjaasAAvVRa.jpg', prompt: '动漫武术对决，传统木质道场内的动态动作场景。', ratio: '16:9', model: 'GPT-image2', createdAt: Date.now() - 1000 * 60 * 60 * 50, seed: 718273, quality: 'ultra', style: 'anime', source: 'mock' },
  { id: 'demo-5', url: 'https://cms-assets.youmind.com/media/1776661968404_8a5flm_HGQc_KOaMAA2vt0.jpg', prompt: '3D 石阶演化信息图，包含照片级生物渲染与侧边栏。', ratio: '16:9', model: 'GPT-image2', createdAt: Date.now() - 1000 * 60 * 60 * 72, seed: 552012, quality: 'standard', style: '3d', source: 'mock' },
  { id: 'demo-6', url: 'https://cms-assets.youmind.com/media/1778921891612_x61gjv_HIX_AadakAQoYcj.jpg', prompt: '赛博美学霓虹肖像，发光眼镜和数学投影。', ratio: '3:4', model: 'GPT-image2', createdAt: Date.now() - 1000 * 60 * 60 * 100, seed: 998211, quality: 'ultra', style: 'cyber', source: 'mock' },
];

const tabs = [
  { id: 'all', en: 'All', cn: '全部', icon: Sparkles },
  { id: 'public', en: 'Public', cn: '已公开', icon: Globe2 },
  { id: 'private', en: 'Private', cn: '私密', icon: Lock },
  { id: 'liked', en: 'Liked', cn: '收藏', icon: Heart },
];

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return '刚刚 · just now';
  if (m < 60) return `${m} min ago · ${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago · ${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d}d ago · ${d} 天前`;
}

function compact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value || 0);
}

export function MyWorksPage() {
  const { works, removeWork, remix } = useStore();
  const [tab, setTab] = useState('all');
  const [layout, setLayout] = useState<'grid' | 'masonry'>('masonry');
  const [active, setActive] = useState<GenerationResult | null>(null);
  const [itemsFromApi, setItemsFromApi] = useState<GenerationResult[]>([]);
  const [statsFromApi, setStatsFromApi] = useState({ total: 0, live: 0, likes: 0, saves: 0 });
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    getWorks({ tab, sort, pageSize: 40 })
      .then((data) => {
        setItemsFromApi(data.items);
        setStatsFromApi(data.stats);
      })
      .catch(() => {
        setItemsFromApi([]);
      });
  }, [tab, sort, works.length]);

  const items = useMemo(() => itemsFromApi.length ? itemsFromApi : works, [itemsFromApi, works]);

  const stats = [
    { v: String(statsFromApi.total || items.length), l: 'Total works', cn: '总作品' },
    { v: String(statsFromApi.live || items.filter(i => i.source === 'api').length), l: 'Live renders', cn: 'API 生成' },
    { v: compact(statsFromApi.likes), l: 'Total likes', cn: '总点赞' },
    { v: compact(statsFromApi.saves), l: 'Saves', cn: '收藏数' },
  ];

  return (
    <div className="relative">
      {/* Header */}
      <section className="relative max-w-[1440px] mx-auto px-8 pt-12 pb-8">
        <div className="absolute -top-10 left-1/3 w-[500px] h-[500px] rounded-full animate-orb pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 60%)', filter: 'blur(60px)' }} />

        <div className="relative flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-pink-400" />
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.15em' }}>
                MY WORKS · 我的作品
              </span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.05 }}>
              Your <span className="text-gradient">creative archive</span>
            </h1>
            <p className="text-white/55 mt-2" style={{ fontSize: 14 }}>
              你的所有生成 · Track, organize, and remix every image you've created with GPT-image2.
            </p>
          </div>

          <button
            onClick={() => remix({ prompt: '一个全新的创意，例如：水墨意境的未来城市，朦胧光晕，电影感' })}
            className="btn-glow rounded-2xl px-5 py-3 flex items-center gap-2"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            <Sparkles size={15} /> New Creation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.l} className="glass-strong rounded-2xl p-5">
              <div className="flex items-baseline justify-between">
                <div className="text-gradient" style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{s.v}</div>
                <span className="text-white/35" style={{ fontSize: 10.5 }}>{s.cn}</span>
              </div>
              <div className="text-white/55 mt-1" style={{ fontSize: 12 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs + controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`glass rounded-xl px-3.5 py-2 flex items-center gap-2 hover:bg-white/8 transition ${active ? 'chip-active' : ''}`}
                  style={{ fontSize: 12.5 }}
                >
                  <Icon size={13} className={active ? 'text-pink-300' : 'text-white/55'} />
                  <span>{t.en}</span>
                  <span className="text-white/40">{t.cn}</span>
                  <span className="text-white/30 ml-1" style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono' }}>
                    {t.id === 'all' ? items.length : Math.floor(items.length / 2)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setSort((s) => s === 'recent' ? 'trending' : 'recent')} className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
              <Clock size={12} /> Sort: Recent
            </button>
            <button className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
              <Filter size={12} /> Filter
            </button>
            <div className="glass rounded-xl flex items-center p-0.5">
              <button onClick={() => setLayout('masonry')} className={`w-8 h-8 rounded-lg flex items-center justify-center ${layout === 'masonry' ? 'chip-active' : ''}`}>
                <LayoutGrid size={13} />
              </button>
              <button onClick={() => setLayout('grid')} className={`w-8 h-8 rounded-lg flex items-center justify-center ${layout === 'grid' ? 'chip-active' : ''}`}>
                <Grid3x3 size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Works grid */}
      <section className="relative max-w-[1440px] mx-auto px-8 pb-16">
        {items.length === 0 ? (
          <EmptyState onCreate={() => remix({ prompt: '' })} />
        ) : (
          <div className={layout === 'grid' ? 'grid grid-cols-4 gap-5' : 'grid grid-cols-4 gap-5'}>
            {items.map((w, i) => (
              <WorkCard
                key={w.id}
                item={w}
                index={i}
                layout={layout}
                onOpen={() => setActive(w)}
                onRemix={() => remix({ prompt: w.prompt, ratio: w.ratio as AspectRatio, style: w.style })}
                onDelete={async () => {
                  await deleteWork(w.id);
                  removeWork(w.id);
                  setItemsFromApi((cur) => cur.filter((item) => item.id !== w.id));
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Detail drawer */}
      <AnimatePresence>
        {active && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setActive(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[560px] z-[70] glass-strong border-l border-white/10 overflow-y-auto noise-bg">
              <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0816]/60 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.15em' }}>
                  MY WORK · #{active.id}
                </span>
                <button onClick={() => setActive(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <div className="rounded-2xl overflow-hidden mb-4 relative">
                  <img src={active.url} className="w-full" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>{active.ratio}</span>
                    <span className="glass rounded-md px-2 py-1 flex items-center gap-1" style={{ fontSize: 10 }}>
                      <Cpu size={10} className="text-violet-300" /> {active.model}
                    </span>
                    <span className={`glass rounded-md px-2 py-1 flex items-center gap-1 ${active.source === 'api' ? '' : ''}`} style={{ fontSize: 10 }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active.source === 'api' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
                      {active.source === 'api' ? 'Live' : 'Demo'}
                    </span>
                  </div>
                </div>

                <div className="glass rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70" style={{ fontSize: 12, fontWeight: 500 }}>Prompt · 完整提示词</span>
                    <button onClick={() => { imageAction(active.id, 'copy'); navigator.clipboard?.writeText(active.prompt); }} className="text-violet-300 flex items-center gap-1 hover:text-pink-300 transition" style={{ fontSize: 11 }}>
                    <Copy size={11} /> Copy
                    </button>
                  </div>
                  <p className="text-white/85" style={{ fontSize: 12.5, lineHeight: 1.6, fontFamily: 'JetBrains Mono' }}>
                    {active.prompt}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { l: 'Model', v: active.model },
                    { l: 'Aspect', v: active.ratio },
                    { l: 'Seed', v: String(active.seed), mono: true },
                    { l: 'Quality', v: active.quality },
                    { l: 'Style', v: active.style ?? '—' },
                    { l: 'Created', v: timeAgo(active.createdAt).split(' · ')[0] },
                  ].map((m) => (
                    <div key={m.l} className="glass rounded-xl p-3">
                      <div className="text-white/40 mb-1" style={{ fontSize: 10 }}>{m.l}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: m.mono ? 'JetBrains Mono' : 'inherit' }}>{m.v}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={() => { remix({ prompt: active.prompt, ratio: active.ratio as AspectRatio, style: active.style }); setActive(null); }}
                    className="btn-glow rounded-xl py-3 flex items-center justify-center gap-2"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    <Wand2 size={14} /> Remix · 二次创作
                    <ArrowRight size={13} />
                  </button>
                  <a href={imageDownloadUrl(active.id)} className="glass rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-white/8 transition" style={{ fontSize: 13 }}>
                    <Download size={14} /> Download HD
                  </a>
                </div>
                <button
                  onClick={async () => {
                    await deleteWork(active.id);
                    removeWork(active.id);
                    setItemsFromApi((cur) => cur.filter((item) => item.id !== active.id));
                    setActive(null);
                  }}
                  className="w-full glass rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-rose-500/15 transition text-rose-300"
                  style={{ fontSize: 12 }}
                >
                  <Trash2 size={12} /> Delete this work
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkCard({
  item, index, layout, onOpen, onRemix, onDelete,
}: {
  item: GenerationResult; index: number; layout: 'grid' | 'masonry';
  onOpen: () => void; onRemix: () => void; onDelete: () => void;
}) {
  // Heights for masonry feel
  const heights = [380, 460, 320, 500, 380, 440, 360, 480];
  const h = layout === 'grid' ? 320 : heights[index % heights.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: (index % 4) * 0.06, duration: 0.55 }}
      whileHover={{ y: -6 }}
      className="group relative rounded-2xl overflow-hidden glass-strong cursor-pointer"
      style={{ height: h }}
      onClick={onOpen}
    >
      <img src={item.url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <span className="glass rounded-md px-2 py-0.5 flex items-center gap-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>
            <span className="w-1 h-1 rounded-full bg-emerald-400" />{item.ratio}
          </span>
          <span className={`glass rounded-md px-2 py-0.5 flex items-center gap-1`} style={{ fontSize: 10 }}>
            <span className={`w-1.5 h-1.5 rounded-full ${item.source === 'api' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
            {item.source === 'api' ? 'Live' : 'Demo'}
          </span>
        </div>
        <span className="text-white/75 glass rounded-md px-2 py-0.5" style={{ fontSize: 10 }}>
          {timeAgo(item.createdAt).split(' · ')[0]}
        </span>
      </div>

      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => { e.stopPropagation(); onRemix(); }}
          className="btn-glow rounded-xl px-3 py-2 flex items-center gap-1.5"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          <Wand2 size={13} /> Remix
        </button>
        <a href={imageDownloadUrl(item.id)} onClick={(e) => { e.stopPropagation(); }} className="glass-strong rounded-xl w-9 h-9 flex items-center justify-center" title="Download">
          <Download size={13} />
        </a>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="glass-strong rounded-xl w-9 h-9 flex items-center justify-center hover:bg-rose-500/30" title="Delete">
          <Trash2 size={13} className="text-rose-300" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p className="text-white/85 line-clamp-2 mb-2" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
          {item.prompt}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu size={10} className="text-violet-300" />
            <span className="text-white/70" style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono' }}>{item.model}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/50" style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono' }}>#{item.seed}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/70" style={{ fontSize: 10.5 }}>
            <Heart size={10} className="text-pink-400" /> {Math.floor(Math.random() * 200) + 12}
            <Bookmark size={10} className="text-violet-300 ml-1" /> {Math.floor(Math.random() * 30) + 2}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass-strong rounded-3xl p-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
        <ImageIcon size={24} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 700 }}>You haven't created anything yet</h3>
      <p className="text-white/55 mt-2 max-w-md" style={{ fontSize: 13 }}>
        还没有任何作品 · Start your first generation and your works will live here forever.
      </p>
      <button onClick={onCreate} className="btn-glow mt-6 rounded-2xl px-5 py-3 flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
        <Sparkles size={14} /> Start creating
      </button>
    </div>
  );
}
