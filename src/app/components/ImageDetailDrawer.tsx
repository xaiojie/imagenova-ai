import { useEffect, useState } from 'react';
import { X, Heart, Bookmark, Copy, Download, Wand2, Share2, Cpu, Calendar, Aperture } from 'lucide-react';
import type { GalleryItem } from './Gallery';
import { useStore } from '../lib/store';
import { getImage, imageAction, imageDownloadUrl } from '../lib/imageApi';
import type { AspectRatio, GenerationResult } from '../lib/imageApi';

export function ImageDetailDrawer({
  item,
  onClose,
  onUpdate,
}: {
  item: GalleryItem | null;
  onClose: () => void;
  onUpdate?: (item: GenerationResult) => void;
}) {
  const { remix } = useStore();
  const [detail, setDetail] = useState<GalleryItem | null>(item);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setDetail(item);
    setImageReady(false);
    setImageError(false);
    if (!item) return;
    getImage(item.id)
      .then((next) => {
        const mapped = {
          ...item,
          ...next,
          user: next.author?.user || item.user,
          avatar: next.author?.avatar || item.avatar,
          h: item.h,
        };
        setDetail(mapped);
        onUpdate?.(next);
      })
      .catch(() => {});
  }, [item?.id]);

  const current = detail || item;
  const likes = current?.likes ?? 0;
  const saves = current?.saves ?? 0;
  const runAction = async (action: 'like' | 'save' | 'copy' | 'share') => {
    if (!current) return;
    const data = await imageAction(current.id, action);
    const mapped = {
      ...current,
      ...data.image,
      user: data.image.author?.user || current.user,
      avatar: data.image.author?.avatar || current.avatar,
      h: current.h,
    };
    setDetail(mapped);
    onUpdate?.(data.image);
    if (action === 'copy') navigator.clipboard?.writeText(data.prompt);
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6">
      <button
        type="button"
        aria-label="关闭详情"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative z-[80] w-full max-w-[860px] max-h-[82vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0a0816]/95 shadow-2xl noise-bg">
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0816]/80 border-b border-white/5 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.15em' }}>图片详情</span>
                <span className="text-white/30">·</span>
                <span className="text-white/50" style={{ fontSize: 11 }}>#{current.id.toUpperCase()}</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[calc(82vh-58px)] overflow-y-auto p-5 md:p-6">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                <div>
              <div className="rounded-2xl overflow-hidden mb-4 relative bg-white/5">
                {!imageReady && !imageError && (
                  <div className="aspect-[4/3] w-full animate-pulse-soft bg-white/5" />
                )}
                {imageError ? (
                  <div className="aspect-[4/3] w-full bg-white/5 flex items-center justify-center text-white/50" style={{ fontSize: 13 }}>
                    图片加载失败
                  </div>
                ) : (
                  <img
                    src={current.url}
                    className={`w-full max-h-[52vh] object-contain ${imageReady ? 'block' : 'hidden'}`}
                    onLoad={() => setImageReady(true)}
                    onError={() => setImageError(true)}
                  />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>{current.ratio}</span>
                  <span className="glass rounded-md px-2 py-1 flex items-center gap-1" style={{ fontSize: 10 }}>
                    <Cpu size={10} className="text-violet-300" /> GPT-image2
                  </span>
                </div>
              </div>

              {/* author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-violet-500 to-pink-500">
                    <div className="w-full h-full rounded-full bg-[#1a1830] flex items-center justify-center" style={{ fontWeight: 600 }}>
                      {current.avatar}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>@{current.user}</div>
                    <div className="text-white/45 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                      <Calendar size={10} /> {current.createdAt ? new Date(current.createdAt).toLocaleString() : '2026-05-13 · 14:32'}
                    </div>
                  </div>
                </div>
                <button className="glass rounded-xl px-3 py-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
                  关注
                </button>
              </div>
                </div>

                <div>
              {/* prompt block */}
              <div className="glass rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70" style={{ fontSize: 12, fontWeight: 500 }}>完整提示词</span>
                  <button onClick={() => runAction('copy').catch(() => navigator.clipboard?.writeText(current.prompt))} className="text-violet-300 flex items-center gap-1 hover:text-pink-300 transition" style={{ fontSize: 11 }}>
                    <Copy size={11} /> 复制
                  </button>
                </div>
                <p className="text-white/85" style={{ fontSize: 13, lineHeight: 1.65, fontFamily: 'JetBrains Mono' }}>
                    {current.prompt}
                </p>
              </div>

              {/* meta grid */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { l: '模型', v: 'GPT-image2', icon: Cpu },
                  { l: '比例', v: current.ratio, icon: Aperture },
                  { l: '种子', v: String(current.seed ?? '982134'), icon: () => <span style={{ fontFamily: 'JetBrains Mono' }}>#</span> },
                  { l: '清晰度', v: current.quality ?? '超清' },
                  { l: '创意强度', v: String(current.creativity ?? '7.5') },
                  { l: '步数', v: String(current.steps ?? '42') },
                ].map((m: any) => (
                  <div key={m.l} className="glass rounded-xl p-3">
                    <div className="text-white/40 mb-1" style={{ fontSize: 10 }}>{m.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: m.l === '种子' ? 'JetBrains Mono' : 'inherit' }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => { remix({ prompt: current.prompt, ratio: current.ratio as AspectRatio, style: current.style, referenceUrl: current.url }); onClose(); }}
                  className="btn-glow rounded-xl py-3 flex items-center justify-center gap-2"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  <Wand2 size={14} /> 二次创作
                </button>
                <a href={imageDownloadUrl(current.id)} className="glass rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-white/8 transition" style={{ fontSize: 13 }}>
                  <Download size={14} /> 下载高清图
                </a>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => runAction('like').catch(() => {})} className={`glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8 transition ${current.liked ? 'text-pink-100' : ''}`} style={{ fontSize: 12 }}>
                  <Heart size={12} className={current.liked ? 'fill-pink-400 text-pink-400' : 'text-pink-400'} /> {likes}
                </button>
                <button onClick={() => runAction('save').catch(() => {})} className={`glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8 transition ${current.saved ? 'text-violet-100' : ''}`} style={{ fontSize: 12 }}>
                  <Bookmark size={12} className={current.saved ? 'fill-violet-300 text-violet-300' : 'text-violet-300'} /> {saves}
                </button>
                <button onClick={() => runAction('share').catch(() => {})} className="glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8 transition" style={{ fontSize: 12 }}>
                  <Share2 size={12} /> 分享
                </button>
              </div>
                </div>
              </div>
            </div>
      </aside>
    </div>
  );
}
