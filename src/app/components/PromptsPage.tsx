import { useMemo, useState } from 'react';
import { BookOpen, Copy, ExternalLink, Filter, Search, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../lib/store';
import { promptCategories, promptGuideSections, promptLibrary } from '../lib/promptLibrary';
import type { AspectRatio } from '../lib/imageApi';

const ratioByCategory: Record<string, AspectRatio> = {
  ui: '9:16',
  poster: '3:4',
  anime: '16:9',
  game: '16:9',
  infographic: '16:9',
  product: '1:1',
  photography: '16:9',
};

export function PromptsPage() {
  const { remix } = useStore();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return promptLibrary.filter((item) => {
      const matchCategory = category === 'all' || item.category === category;
      const matchSource = source === 'all' || item.source === source;
      const matchQuery = !q || `${item.title} ${item.cn} ${item.desc} ${item.prompt} ${item.tags.join(' ')}`.toLowerCase().includes(q);
      return matchCategory && matchSource && matchQuery;
    });
  }, [category, query, source]);

  return (
    <main className="relative">
      <section className="relative max-w-[1440px] mx-auto px-8 pt-12 pb-8">
        <div className="flex items-end justify-between gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-300 to-pink-400" />
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#f472b6', letterSpacing: '0.15em' }}>
                PROMPT GALLERY · 提示词广场
              </span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.05 }}>
              Curated <span className="text-gradient">GPT Image 2</span> prompts
            </h1>
            <p className="text-white/55 mt-3 max-w-[720px]" style={{ fontSize: 14, lineHeight: 1.7 }}>
              从 YouMind OpenLab 和 ZeroLu 的优秀案例中精选，覆盖摄影写实、UI、信息图、海报、游戏、动漫和产品营销。
            </p>
          </div>
          <div className="glass-strong rounded-2xl p-4 w-[360px]">
            <div className="flex items-center gap-2 text-white/70 mb-3" style={{ fontSize: 12 }}>
              <BookOpen size={14} className="text-amber-300" /> Prompt craft scorecard
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                [`${promptLibrary.length}`, '案例'],
                ['8', '分类'],
                ['6', '教程'],
              ].map(([v, l]) => (
                <div key={l} className="glass rounded-xl p-3 text-center">
                  <div className="text-gradient" style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
                  <div className="text-white/45" style={{ fontSize: 11 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索：电商、信息图、RAW、头像、海报..."
              className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 outline-none placeholder-white/30"
              style={{ fontSize: 13 }}
            />
          </div>
          <button
            onClick={() => setSource((cur) => cur === 'all' ? 'YouMind' : cur === 'YouMind' ? 'ZeroLu' : 'all')}
            className="glass rounded-xl px-4 py-3 flex items-center gap-2 hover:bg-white/8"
            style={{ fontSize: 12.5 }}
          >
            <Filter size={13} /> Source: {source}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {promptCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              className={`glass rounded-xl px-3.5 py-2 flex items-center gap-2 hover:bg-white/8 transition ${category === item.id ? 'chip-active' : ''}`}
              style={{ fontSize: 12.5 }}
            >
              <span>{item.label}</span>
              <span className="text-white/40">{item.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="relative max-w-[1440px] mx-auto px-8 pb-14">
        <div className="grid grid-cols-4 gap-5">
          {filtered.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 8) * 0.035 }}
              className="group glass-strong rounded-2xl overflow-hidden"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/15" />
                <div className="absolute top-3 left-3 right-3 flex justify-between gap-2">
                  <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>{item.source}</span>
                  <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10 }}>{item.difficulty}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="truncate" style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</h3>
                    <span className="text-white/45 shrink-0" style={{ fontSize: 11 }}>{item.cn}</span>
                  </div>
                  <p className="text-white/60 line-clamp-2" style={{ fontSize: 11.5, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.tags.map((tag) => (
                    <span key={tag} className="glass rounded-md px-2 py-1 text-white/55" style={{ fontSize: 10 }}>{tag}</span>
                  ))}
                </div>
                <p className="text-white/65 line-clamp-4 min-h-[76px]" style={{ fontSize: 11.5, lineHeight: 1.65, fontFamily: 'JetBrains Mono' }}>
                  {item.prompt}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => remix({ prompt: item.prompt, ratio: ratioByCategory[item.category] ?? '1:1', style: styleByCategory(item.category) })}
                    className="btn-glow rounded-xl py-2.5 flex items-center justify-center gap-1.5"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    <Wand2 size={12} /> Use
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(item.prompt)}
                    className="glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/8"
                    style={{ fontSize: 12 }}
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative max-w-[1440px] mx-auto px-8 pb-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-sky-400 to-violet-500" />
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#60a5fa', letterSpacing: '0.15em' }}>
                PROMPT GUIDE · 教程
              </span>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 700 }}>
              如何写出 <span className="text-gradient">稳定可控</span> 的提示词
            </h2>
          </div>
          <a href="https://github.com/YouMind-OpenLab/awesome-gpt-image-2" target="_blank" rel="noreferrer" className="text-white/65 hover:text-white flex items-center gap-1.5" style={{ fontSize: 13 }}>
            Source references <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {promptGuideSections.map((section) => (
            <div key={section.title} className="glass-strong rounded-2xl p-5">
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{section.title}</h3>
              <p className="text-white/58 mt-3" style={{ fontSize: 12.5, lineHeight: 1.7 }}>{section.body}</p>
              <div className="glass rounded-xl p-3 mt-4 text-white/65" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                {section.example}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function styleByCategory(category: string) {
  if (category === 'anime') return 'anime';
  if (category === 'product' || category === 'poster') return 'product';
  if (category === 'photography') return 'realistic';
  if (category === 'infographic' || category === 'ui') return 'concept';
  if (category === 'game') return '3d';
  return 'cinematic';
}
