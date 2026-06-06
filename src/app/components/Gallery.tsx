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
  { id: 'g1', url: '/assets/showcase/1776658772018-lukyfw-hgsufldbiaeimwz-b0eb3f27.jpg', prompt: '高科技 VR 头显的垂直堆叠爆炸视图海报，展示多层内部组件和精致标注。', user: 'YouMind Lab', avatar: 'Y', ratio: '16:9', likes: 2840, saves: 412, h: 360 },
  { id: 'g2', url: '/assets/showcase/1776662673014-nf0taw-hgrmndybsaagg88-72e7da42.jpg', prompt: '复古羊皮纸上的水彩墨水手绘城市美食地图，包含编号美食、地标和图例。', user: 'Map Studio', avatar: 'M', ratio: '16:9', likes: 1923, saves: 287, h: 300 },
  { id: 'g3', url: '/assets/showcase/1776699445498-ga2ry5-hgo7h0dwkaapdkk-ab96ec6c.jpg', prompt: '逼真的社交媒体电商直播界面样机，叠加聊天、礼物和商品购买卡片。', user: 'Commerce UI', avatar: 'C', ratio: '9:16', likes: 5210, saves: 891, h: 500 },
  { id: 'g4', url: '/assets/showcase/1776756799880-c8u8w7-hgukjjaasaavvra-a99be45a.jpg', prompt: '动态动漫插画，两名少女在传统木质道场内进行武术对决。', user: 'Anime Dojo', avatar: 'A', ratio: '16:9', likes: 3104, saves: 502, h: 300 },
  { id: 'g5', url: '/assets/showcase/1776661968404-8a5flm-hgqc-koamaa2vt0-0d1ee4bb.jpg', prompt: '高度逼真的 3D 石阶演化信息图，每一级展示不同生物模型。', user: 'Edu Visual', avatar: 'E', ratio: '16:9', likes: 1521, saves: 198, h: 280 },
  { id: 'g6', url: '/assets/showcase/1778921891612-x61gjv-hix-aadakaqoycj-dd3480e1.jpg', prompt: '赛博美学霓虹肖像，发光眼镜与数学 HUD 投影覆盖面部和夹克。', user: 'Neon Face', avatar: 'N', ratio: '3:4', likes: 6912, saves: 1240, h: 440 },
  { id: 'g7', url: '/assets/showcase/1778922047354-0u5p7u-hiybwlowwaasxok-0dc6824c.jpg', prompt: '粉色 Q 版动漫吉祥物手持三角形标志，适合品牌推广头像。', user: 'Mascot Lab', avatar: 'Q', ratio: '1:1', likes: 980, saves: 142, h: 380 },
  { id: 'g8', url: '/assets/showcase/1778921879298-86knan-hix7rmjakacvvqz-db73c36e.jpg', prompt: 'Q 版旅行 Vlog 海报，巨大 3D 城市字体内填充地标摄影。', user: 'Vlog Poster', avatar: 'V', ratio: '3:4', likes: 4205, saves: 612, h: 430 },
  { id: 'g9', url: '/assets/showcase/1778921961875-i1n9vo-hizvittbaaae-3g-393fd79d.jpg', prompt: '深色主题 PowerPoint 风格编辑窗口，展示背景透明的可爱兔图标。', user: 'Slide UI', avatar: 'S', ratio: '4:3', likes: 2110, saves: 333, h: 350 },
  { id: 'g10', url: '/assets/showcase/1778921884401-0kutj1-hixcmi3auaaryej-8a859714.jpg', prompt: '柔和手工层叠纸雕插画，圆润形状和温暖舒适的纸艺美学。', user: 'Paper Craft', avatar: 'P', ratio: '3:4', likes: 3678, saves: 502, h: 450 },
  { id: 'g11', url: '/assets/showcase/1778921974908-m837gj-hiv1z88bgaekx6z-188cdcb2.jpg', prompt: '2×2 照片级逼真眼镜店室内对比拼贴图，标注不同图像模型名称。', user: 'Optic Grid', avatar: 'O', ratio: '16:9', likes: 1450, saves: 220, h: 260 },
  { id: 'g12', url: '/assets/showcase/1778921976047-imleff-hiv12qfbuaaz4xy-c1c76ae9.jpg', prompt: '四格对比拼图，展示不同图像模型重现日本 DX Report 信息图。', user: 'DX Report', avatar: 'D', ratio: '16:9', likes: 5089, saves: 712, h: 300 },
];

const filters = [
  { label: '最新', sort: 'recent', icon: Clock },
  { label: '热门', sort: 'trending', icon: Flame },
  { label: '上升', sort: 'rising', icon: TrendingUp },
];

export function Gallery({ onOpen }: { onOpen: (item: GalleryItem) => void }) {
  const [active, setActive] = useState('最新');
  const [items, setItems] = useState<GalleryItem[]>(galleryItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const { remix } = useStore();

  const updateItem = (next: GenerationResult) => {
    setItems((cur) => cur.map((item) => (item.id === next.id ? {
      ...item,
      ...next,
      user: next.author?.user || item.user,
      avatar: next.author?.avatar || item.avatar,
      h: item.h,
    } : item)));
  };

  const runAction = async (item: GalleryItem, action: 'like' | 'save' | 'copy' | 'share') => {
    const data = await imageAction(item.id, action);
    updateItem(data.image);
    if (action === 'copy') navigator.clipboard?.writeText(data.prompt);
  };

  const loadGallery = async (nextPage: number, replace = false) => {
    const sort = filters.find((item) => item.label === active)?.sort || 'recent';
    setLoading(true);
    return getGallery({ sort, page: nextPage, pageSize: 12 })
      .then((data) => {
        const mapped = data.items.map((item, index) => ({
          ...item,
          user: item.author?.user || '创作者',
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
    <section id="gallery-section" className="relative max-w-[1440px] mx-auto px-4 md:px-8 pb-14 md:pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-pink-400" />
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#a78bfa', letterSpacing: '0.15em' }}>
              公共图库
            </span>
          </div>
          <h2 className="section-title" style={{ fontSize: 40, fontWeight: 700 }}>
            浏览创作者生成的 <span className="text-gradient">精彩作品</span>
          </h2>
          <p className="text-white/55 mt-2" style={{ fontSize: 14 }}>
            围观大家用 GPT-image2 生成的精彩作品，点击图片即可查看提示词并二次创作。
          </p>
        </div>
        <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = active === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActive(f.label)}
                className={`glass rounded-xl px-3.5 py-2 flex items-center gap-2 hover:bg-white/8 transition shrink-0 ${isActive ? 'chip-active' : ''}`}
                style={{ fontSize: 12.5 }}
              >
                <Icon size={13} className={isActive ? 'text-pink-300' : 'text-white/55'} />
                <span>{f.label}</span>
              </button>
            );
          })}
          <button className="glass rounded-xl px-3.5 py-2 flex items-center gap-2 hover:bg-white/8 transition shrink-0" style={{ fontSize: 12.5 }}>
            <Filter size={13} className="text-white/55" /> 筛选
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-5">
            {col.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: (ci * 0.06) + (i * 0.08), duration: 0.6, ease: 'easeOut' }}
                whileHover={{ y: -6 }}
                onClick={() => onOpen(item)}
                className="group relative rounded-2xl overflow-hidden glass-strong cursor-pointer text-left mobile-masonry-card"
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
                  <button type="button" onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-lg glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <MoreHorizontal size={13} />
                  </button>
                </div>

                {/* hover overlay actions */}
                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <span className="glass-strong rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                    <Eye size={13} /> 查看详情
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remix({ prompt: item.prompt, ratio: item.ratio as AspectRatio, style: item.style, referenceUrl: item.url }); }}
                    className="rounded-xl px-3 py-2 flex items-center gap-1.5 btn-glow"
                    style={{ fontSize: 12 }}
                  >
                    <Wand2 size={13} /> 二次创作
                  </button>
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
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); runAction(item, 'like').catch(() => {}); }}
                        className={`flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-white/10 ${item.liked ? 'text-pink-200' : 'text-white/70'}`}
                        style={{ fontSize: 11 }}
                      >
                        <Heart size={11} className={item.liked ? 'fill-pink-400 text-pink-400' : 'text-pink-400'} /> {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); runAction(item, 'save').catch(() => {}); }}
                        className={`flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-white/10 ${item.saved ? 'text-violet-200' : 'text-white/70'}`}
                        style={{ fontSize: 11 }}
                      >
                        <Bookmark size={11} className={item.saved ? 'fill-violet-300 text-violet-300' : 'text-violet-300'} /> {item.saves}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); runAction(item, 'copy').catch(() => navigator.clipboard?.writeText(item.prompt)); }}
                        className="w-6 h-6 rounded-md glass flex items-center justify-center hover:bg-white/15 transition"
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
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
          {loading ? '加载中...' : hasMore ? '加载更多' : '已加载完'}
          <span style={{ fontFamily: 'JetBrains Mono', color: '#a78bfa', fontSize: 11 }}>+12</span>
        </button>
      </div>
    </section>
  );
}
