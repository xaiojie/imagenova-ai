import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Send, ChevronDown, ChevronUp, Cpu, Image as ImageIcon,
  Shuffle, Eye, Globe2, Wand2,
  AlertCircle, CheckCircle2, Heart, Download, Copy,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import {
  getConfig, getInspiration, imageAction, imageDownloadUrl,
  AspectRatio, ImageQuality, GenerationResult,
} from '../lib/imageApi';
import { ImageDetailDrawer } from './ImageDetailDrawer';
import type { GalleryItem } from './Gallery';

const ratios: { id: AspectRatio; label: string; sub: string; w: number; h: number }[] = [
  { id: '1:1', label: '1:1', sub: '方图', w: 28, h: 28 },
  { id: '16:9', label: '16:9', sub: '横图', w: 36, h: 22 },
  { id: '9:16', label: '9:16', sub: '竖图', w: 22, h: 36 },
  { id: '4:3', label: '4:3', sub: '经典', w: 32, h: 24 },
  { id: '3:4', label: '3:4', sub: '海报', w: 24, h: 32 },
];

const styles = [
  { id: 'cinematic', label: '电影感', cn: '光影叙事', color: 'from-amber-400 to-rose-500' },
  { id: 'realistic', label: '写实摄影', cn: '真实质感', color: 'from-stone-300 to-stone-500' },
  { id: 'anime', label: '动漫插画', cn: '角色场景', color: 'from-pink-400 to-violet-500' },
  { id: 'product', label: '产品海报', cn: '商业摄影', color: 'from-sky-300 to-blue-500' },
  { id: 'concept', label: '概念设计', cn: '世界观', color: 'from-violet-400 to-fuchsia-500' },
  { id: 'cyber', label: '赛博朋克', cn: '霓虹未来', color: 'from-cyan-400 to-pink-500' },
  { id: 'ink', label: '国风水墨', cn: '东方意境', color: 'from-slate-300 to-slate-500' },
  { id: '3d', label: '三维渲染', cn: '立体材质', color: 'from-emerald-300 to-teal-500' },
];

const promptTemplates = [
  '电影级光影', '超高细节', '真实摄影质感', '柔和体积光',
  '高级商业海报', 'iPhone 摄影质感', '景深虚化', '黄金时刻',
];

const qualityOptions: Array<{ value: ImageQuality; label: string; desc: string }> = [
  { value: 'standard', label: '标准', desc: '速度优先' },
  { value: 'hd', label: '高清', desc: '细节增强' },
  { value: 'ultra', label: '超清', desc: '默认推荐' },
];

const randomPrompts = [
  '一款透明玻璃质感的智能耳机悬浮在柔和浅灰背景中，内部结构若隐若现，摄影棚柔光，金属边缘高光，商业产品海报，画面干净高级',
  '雨后清晨的江南老街，青石板反射微光，白墙黑瓦、红色纸伞和远处茶馆灯笼，空气中有薄雾，电影级构图，真实摄影质感',
  '新中式茶饮新品海报，中央是一杯山柚观音冷泡茶，杯壁凝结水珠，背景为宣纸纹理和淡墨山水，标题区留白充足，轻奢商业视觉',
  '一只宇航员猫站在月球边缘眺望蓝色地球，宇航服细节真实，星空深邃，柔和轮廓光，童话感与科幻感结合，适合竖版海报',
  '未来城市空中图书馆，巨大的圆形书架漂浮在云层之间，读者坐在透明悬浮舱中阅读，暖色日落光，宏大概念艺术，细节丰富',
  '复古胶片风格的海边便利店夜景，蓝色霓虹招牌、自动贩卖机、湿润路面和远处海浪，画面安静治愈，35mm 胶片颗粒',
  '高端香水瓶产品摄影，透明瓶身置于浅水台面，周围有白色花瓣和细小水波，逆光折射出彩色光斑，极简奢侈品广告质感',
  '国风水墨山谷中的未来列车，银色车身穿过云雾和松林，远山留白，局部有青绿色光轨，传统水墨与科幻工业设计融合',
  '可爱的原创动漫角色设定表，包含正面、侧面、背面、三种表情和配色板，白底干净排版，服装细节清晰，适合角色设计展示',
  '博物馆级信息图海报，主题为一台复古机械相机的结构拆解，包含镜头、快门、胶卷仓和机身材质标注，米白纸张背景，中文注释清晰',
  '冬日咖啡馆窗边的写实照片，一杯热拿铁、翻开的书和毛线围巾放在木桌上，窗外飘雪，暖色室内灯光，浅景深，安静温柔',
  '大型游戏场景概念图，古代遗迹被巨树根系缠绕，中央有发光石门，探险者举着火把站在入口前，体积光、尘埃粒子、史诗氛围',
];

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds} 秒`;
  return `${minutes} 分 ${String(seconds).padStart(2, '0')} 秒`;
}

export function GeneratePanel() {
  const {
    prompt, setPrompt, ratio, setRatio, style, setStyle, referenceUrl, setReferenceUrl,
    pendingRemix, user, setUser, openAuth, generation, startGeneration, setGenerationError,
  } = useStore();
  const [tags, setTags] = useState<string[]>(['电影级光影', '超高细节']);
  const [advanced, setAdvanced] = useState(true);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [batch, setBatch] = useState(1);
  const [quality, setQuality] = useState<ImageQuality>('ultra');
  const [creativity, setCreativity] = useState(7.5);
  const [seed, setSeed] = useState(982134);
  const [publish, setPublish] = useState(true);
  const [reference, setReference] = useState<File | null>(null);
  const [referenceImageError, setReferenceImageError] = useState(false);
  const [activeResult, setActiveResult] = useState<GalleryItem | null>(null);
  const [elapsedNow, setElapsedNow] = useState(Date.now());
  const panelRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getConfig()
      .then((cfg) => {
        setApiConfigured(cfg.hasApiKey);
        setUser(cfg.user);
        setBatch((current) => Math.min(current, 1));
      })
      .catch(() => setApiConfigured(false));
  }, []);

  // When a Remix is triggered elsewhere, scroll here and focus.
  useEffect(() => {
    if (pendingRemix === 0) return;
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => taRef.current?.focus(), 600);
  }, [pendingRemix]);

  useEffect(() => {
    if (!generation.generating) return;
    setElapsedNow(Date.now());
    const timer = window.setInterval(() => setElapsedNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [generation.generating, generation.startedAt]);

  useEffect(() => {
    setReferenceImageError(false);
  }, [referenceUrl]);

  const toggleTag = (t: string) => {
    setTags((cur) => cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]);
  };

  const inspire = async () => {
    try {
      const next = await getInspiration(prompt, style);
      setPrompt(next.prompt);
    } catch (e: any) {
      setGenerationError(e?.message ?? '灵感生成失败');
    }
  };

  const randomizePrompt = () => {
    const candidates = randomPrompts.filter((item) => item !== prompt);
    const next = candidates[Math.floor(Math.random() * candidates.length)] || randomPrompts[0];
    setPrompt(next);
    setGenerationError(null);
    window.setTimeout(() => taRef.current?.focus(), 0);
  };

  const start = async () => {
    if (generation.generating || !prompt.trim()) return;
    if (!user) {
      setGenerationError('请先登录，登录后会继续保留当前提示词和参数。');
      openAuth('login');
      return;
    }
    await startGeneration({
      prompt,
      ratio,
      n: batch,
      quality,
      style,
      creativity,
      seed,
      publish,
      tags,
      reference,
      referenceUrl,
    });
  };

  const handleBatchChange = (value: number) => {
    if (value > 1) {
      setBatch(1);
      setGenerationError('批量生成属于会员功能，敬请期待。');
      return;
    }
    setBatch(1);
    setGenerationError(null);
  };

  const generating = generation.generating;
  const progress = generation.progress;
  const results = generation.results;
  const error = generation.error;
  const previewSlots = generating ? generation.batch : Math.max(batch, results.length);
  const qualityLabel = qualityOptions.find((item) => item.value === quality)?.label || '超清';
  const elapsedText = formatElapsed(elapsedNow - (generation.startedAt || elapsedNow));
  const toDetailItem = (item: GenerationResult): GalleryItem => ({
    ...item,
    user: item.author?.user || user?.name || '我的作品',
    avatar: item.author?.avatar || user?.avatar || '我',
    likes: item.likes ?? 0,
    saves: item.saves ?? 0,
    h: 360,
  });

  return (
    <>
      <section ref={panelRef} className="relative max-w-[1440px] mx-auto px-4 md:px-8 mt-0 md:-mt-6 pb-12 md:pb-16 scroll-mt-24">
        <div className="relative">
        <div className="absolute -inset-2 rounded-[32px] opacity-40 md:opacity-60 blur-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(236,72,153,0.4), rgba(251,113,133,0.3))' }} />

        <div className="relative glass-strong rounded-[22px] md:rounded-[28px] p-4 md:p-8 noise-bg overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
                <Wand2 size={18} className="text-white" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>Nova Studio</div>
                <div className="text-white/50" style={{ fontSize: 12 }}>开始你的创作，把想法变成画面</div>
              </div>
            </div>
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2 shrink-0" style={{ fontSize: 11.5 }}>
                {apiConfigured ? (
                  <><CheckCircle2 size={12} className="text-emerald-400" /><span className="text-white/65">真实接口已连接</span></>
                ) : (
                  <><AlertCircle size={12} className="text-amber-300" /><span className="text-white/65">演示模式 · 请配置密钥</span></>
                )}
              </div>
              <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2 shrink-0" style={{ fontSize: 12 }}>
                <Cpu size={12} className="text-violet-300" />
                <span className="text-white/60">引擎</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f472b6' }}>GPT-image2 · v2.4</span>
                <ChevronDown size={12} className="text-white/40" />
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-violet-500/40 via-pink-500/40 to-amber-400/30">
            <div className="rounded-2xl bg-[#0c0a1f]/90 p-5">
              <textarea
                ref={taRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') start();
                }}
                placeholder="描述你想生成的画面，例如：新中式茶饮海报，宣纸纹理，淡墨山水，高级商业视觉..."
                className="w-full bg-transparent outline-none resize-none placeholder-white/30"
                style={{ fontSize: 15, lineHeight: 1.55, minHeight: 88 }}
              />
              <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => setReference(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-white/50 hover:text-white/90 transition rounded-lg px-2.5 py-1.5 hover:bg-white/5 flex items-center gap-1.5"
                    style={{ fontSize: 12 }}
                  >
                    <ImageIcon size={13} /> {reference ? reference.name.slice(0, 18) : '参考图'}
                  </button>
                  <button onClick={inspire} className="text-white/50 hover:text-white/90 transition rounded-lg px-2.5 py-1.5 hover:bg-white/5 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                    <Shuffle size={13} /> 灵感
                  </button>
                  <button onClick={randomizePrompt} className="text-white/50 hover:text-white/90 transition rounded-lg px-2.5 py-1.5 hover:bg-white/5 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                    <Wand2 size={13} /> 随机提示词
                  </button>
                  <span className="text-white/30" style={{ fontSize: 11 }}>{prompt.length} 字</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40" style={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}>
                    ⌘ + ↵
                  </div>
                </div>
                {referenceUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {referenceImageError ? (
                        <div className="flex h-full w-full items-center justify-center text-white/35">
                          <ImageIcon size={18} />
                        </div>
                      ) : (
                        <img
                          src={referenceUrl}
                          alt="编辑参考图"
                          className="h-full w-full object-cover"
                          onError={() => setReferenceImageError(true)}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-white/80" style={{ fontSize: 12, fontWeight: 600 }}>
                        <ImageIcon size={13} className="text-pink-300" />
                        当前图片将作为编辑参考图
                      </div>
                      <div className="mt-1 truncate text-white/35" style={{ fontSize: 11 }}>
                        点击生成后会调用图片编辑接口
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReferenceUrl('')}
                      className="h-8 w-8 shrink-0 rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
                      title="移除参考图"
                    >
                      <X size={14} className="mx-auto" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 md:flex-row md:items-center">
                    <div className="flex items-center gap-1.5 text-white/45 shrink-0" style={{ fontSize: 12 }}>
                      <ImageIcon size={13} />
                      编辑参考图
                    </div>
                    <input
                      value={referenceUrl}
                      onChange={(e) => setReferenceUrl(e.target.value)}
                      placeholder="粘贴公网图片地址后，将调用图片编辑接口"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 outline-none placeholder-white/25 focus:border-pink-400/50"
                      style={{ fontSize: 12 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-white/80" style={{ fontSize: 13, fontWeight: 500 }}>图片比例</span>
                <span className="text-white/35" style={{ fontSize: 11 }}>画面比例</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                {ratios.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r.id)}
                    className={`glass rounded-xl p-2 md:p-3 flex flex-col items-center gap-1.5 transition hover:bg-white/8 ${ratio === r.id ? 'chip-active' : ''}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="border border-white/40 rounded" style={{ width: r.w * 0.7, height: r.h * 0.7 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
                    <span className="text-white/40" style={{ fontSize: 9 }}>{r.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-white/80" style={{ fontSize: 13, fontWeight: 500 }}>风格预设</span>
                <span className="text-white/35" style={{ fontSize: 11 }}>风格选择</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`glass rounded-xl p-2.5 flex items-center gap-2 transition hover:bg-white/8 ${style === s.id ? 'chip-active' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${s.color} shrink-0`} />
                    <div className="text-left min-w-0">
                      <div className="truncate" style={{ fontSize: 11.5, fontWeight: 500 }}>{s.label}</div>
                      <div className="text-white/35 truncate" style={{ fontSize: 9 }}>{s.cn}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-white/80" style={{ fontSize: 13, fontWeight: 500 }}>基础提示词模板</span>
              <span className="text-white/35" style={{ fontSize: 11 }}>点击添加</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {promptTemplates.map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`glass rounded-full px-3.5 py-1.5 transition hover:bg-white/8 ${active ? 'chip-active' : ''}`}
                    style={{ fontSize: 12 }}
                  >
                    <span className={active ? '' : 'text-white/65'}>+ {t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={() => setAdvanced(!advanced)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition"
              style={{ fontSize: 13 }}
            >
              <span>高级参数</span>
              <span className="text-white/35" style={{ fontSize: 11 }}>参数设置</span>
              {advanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence initial={false}>
              {advanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-4">
                    <ParamCard label="图片数量" sub="数量" value={batch}>
                      <input type="range" min={1} max={4} value={batch} onChange={(e) => handleBatchChange(Number(e.target.value))} className="w-full accent-pink-500" />
                    </ParamCard>
                    <ParamCard label="清晰度" sub="质量" value={qualityLabel}>
                      <QualitySelect value={quality} onChange={setQuality} />
                    </ParamCard>
                    <ParamCard label="创意强度" sub="发散度" value={creativity}>
                      <input type="range" min={0} max={10} step={0.5} value={creativity} onChange={(e) => setCreativity(Number(e.target.value))} className="w-full accent-pink-500" />
                    </ParamCard>
                    <ParamCard label="随机种子" sub="种子" value={seed} mono>
                      <input value={seed} onChange={(e) => setSeed(Number(e.target.value) || 1)} className="w-full bg-transparent outline-none text-white/70" style={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    </ParamCard>
                  </div>
                  <div className="flex items-center justify-between mt-3 glass rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Globe2 size={15} className="text-emerald-300" />
                      <div>
                        <div style={{ fontSize: 12.5 }}>公开到图库</div>
                        <div className="text-white/40" style={{ fontSize: 10.5 }}>生成后展示在公共图库</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setPublish((v) => !v)}
                      className={`w-11 h-6 rounded-full relative ${publish ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition ${publish ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:flex sm:items-center gap-3">
            <button
              onClick={start}
              disabled={generating || !prompt.trim()}
              className="btn-glow rounded-2xl px-7 py-4 flex items-center gap-2.5 flex-1 justify-center disabled:opacity-60"
              style={{ fontSize: 15, fontWeight: 600 }}
            >
              <Sparkles size={17} />
              {generating ? 'GPT-image2 正在生成...' : '立即生成图片'}
              {!generating && <Send size={15} />}
            </button>
            <button className="glass rounded-2xl px-5 py-4 hover:bg-white/8 transition flex items-center justify-center gap-2" style={{ fontSize: 13 }}>
              <Eye size={14} /> 预览
            </button>
          </div>

          {error && (
            <div className="mt-4 glass rounded-xl px-4 py-3 flex items-center gap-2 border border-rose-400/30" style={{ fontSize: 12.5 }}>
              <AlertCircle size={14} className="text-rose-400" /> {error}
            </div>
          )}

          <AnimatePresence>
            {(generating || results.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${generating ? 'bg-pink-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {generating ? 'GPT-image2 正在生成...' : `已生成 ${results.length} 张图片`}
                      </span>
                      <span className="text-white/40" style={{ fontSize: 11 }}>
                        {generating ? `正在生成 · 已用时 ${elapsedText}` : `保存到「我的作品」 · ${results[0]?.source === 'mock' ? '演示' : '真实'}`}
                      </span>
                    </div>
                    {generating && (
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#f472b6' }}>{Math.round(progress)}%</span>
                    )}
                  </div>
                  {generating && (
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full shimmer-bar rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {Array.from({ length: previewSlots }).map((_, i) => {
                      const r = results[i];
                      return (
                        <div
                          key={i}
                          role={r ? 'button' : undefined}
                          tabIndex={r ? 0 : undefined}
                          aria-label={r ? '查看图片详情' : undefined}
                          onClick={() => r && setActiveResult(toDetailItem(r))}
                          onKeyDown={(event) => {
                            if (!r) return;
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setActiveResult(toDetailItem(r));
                            }
                          }}
                          className={`aspect-square rounded-xl overflow-hidden relative bg-white/5 group ${r ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300/70' : ''}`}
                        >
                          {r ? (
                            <>
                              <img src={r.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
                                <span className="glass-strong rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                                  <Eye size={13} /> 查看详情
                                </span>
                              </div>
                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                                <button onClick={(e) => { e.stopPropagation(); imageAction(r.id, 'like'); }} className="glass rounded-md px-1.5 py-1" style={{ fontSize: 10 }} title="点赞"><Heart size={10} className="text-pink-400" /></button>
                                <button onClick={(e) => { e.stopPropagation(); imageAction(r.id, 'copy'); navigator.clipboard?.writeText(r.prompt); }} className="glass rounded-md px-1.5 py-1" style={{ fontSize: 10 }} title="复制提示词"><Copy size={10} /></button>
                                <a href={imageDownloadUrl(r.id)} onClick={(e) => e.stopPropagation()} className="glass rounded-md px-1.5 py-1" style={{ fontSize: 10 }} title="下载"><Download size={10} /></a>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 animate-pulse-soft" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.18))' }} />
                              <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 1.6s linear infinite' }} />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </section>

      <ImageDetailDrawer
        item={activeResult}
        onClose={() => setActiveResult(null)}
        onUpdate={(next) => {
          setActiveResult((current) => (current?.id === next.id ? {
            ...current,
            ...next,
            user: next.author?.user || current.user,
            avatar: next.author?.avatar || current.avatar,
            h: current.h,
          } : current));
        }}
      />
    </>
  );
}

function QualitySelect({
  value,
  onChange,
}: {
  value: ImageQuality;
  onChange: (value: ImageQuality) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = qualityOptions.find((item) => item.value === value) || qualityOptions[2];

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left text-white/80 outline-none transition hover:bg-white/8 focus:border-violet-300/60"
        style={{ fontSize: 11 }}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate font-medium text-white/85">{selected.label}</span>
            <span className="block truncate text-white/35" style={{ fontSize: 9 }}>{selected.desc}</span>
          </span>
          <ChevronDown size={13} className={`shrink-0 text-white/45 transition ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#16122b]/95 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {qualityOptions.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-2.5 py-2 text-left transition ${active ? 'chip-active text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}
                style={{ fontSize: 11 }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-white/35" style={{ fontSize: 9 }}>{option.desc}</span>
                  </span>
                  {active ? <CheckCircle2 size={12} className="text-emerald-300" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ParamCard({
  label, sub, value, mono, children,
}: {
  label: string;
  sub: string;
  value: string | number;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70" style={{ fontSize: 12 }}>{label}</span>
        <span className="text-white/35" style={{ fontSize: 10 }}>{sub}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span style={{ fontSize: 18, fontWeight: 600, fontFamily: mono ? 'JetBrains Mono' : 'Space Grotesk' }}>
          {value}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
