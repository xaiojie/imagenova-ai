import { ArrowRight, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPromptPresets, PromptPreset, usePromptPreset } from '../lib/imageApi';
import { useStore } from '../lib/store';

const presets = [
  { title: 'Portrait Photography', cn: '人像摄影', desc: 'Editorial-grade portraits with cinematic skin tones', url: 'https://images.unsplash.com/photo-1664267674275-6017ea4c7f6e?w=600&q=80', tag: '12 templates' },
  { title: 'Product Poster', cn: '产品海报', desc: 'Studio-lit product posters for ecommerce and ads', url: 'https://images.unsplash.com/photo-1749063294255-719a5ffa9de3?w=600&q=80', tag: '8 templates' },
  { title: 'Chinese Ink Painting', cn: '国风插画', desc: '水墨意境 · misty mountains, brush textures, poetic', url: 'https://images.unsplash.com/photo-1776883003471-767e3cb7e5eb?w=600&q=80', tag: '10 templates' },
  { title: 'Sci-Fi Scenes', cn: '科幻场景', desc: 'Spaceships, neon cities, otherworldly architecture', url: 'https://images.unsplash.com/photo-1761942407242-bec5f94898e2?w=600&q=80', tag: '14 templates' },
  { title: 'Game Characters', cn: '游戏角色', desc: 'Concept art, character sheets, stylized portraits', url: 'https://images.unsplash.com/photo-1559828801-04565cd31e27?w=600&q=80', tag: '9 templates' },
  { title: 'Architectural Space', cn: '建筑空间', desc: 'Interior renders, futuristic facades, modern spaces', url: 'https://images.unsplash.com/photo-1760662036240-7c9ef0730d79?w=600&q=80', tag: '11 templates' },
];

export function PromptPresets() {
  const [items, setItems] = useState<PromptPreset[]>([]);
  const { remix } = useStore();

  useEffect(() => {
    getPromptPresets({ sort: 'popular' })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  const visible = items.length ? items : presets.map((p, index) => ({
    id: `fallback-${index}`,
    category: 'fallback',
    title: p.title,
    cn: p.cn,
    prompt: p.desc,
    desc: p.desc,
    uses: 0,
  }));

  return (
    <section id="prompts-section" className="relative max-w-[1440px] mx-auto px-8 pb-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-300 to-pink-400" />
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#f472b6', letterSpacing: '0.15em' }}>
              PROMPT PRESETS · 提示词广场
            </span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700 }}>
            Start from a <span className="text-gradient">curated prompt</span>
          </h2>
          <p className="text-white/55 mt-2" style={{ fontSize: 14 }}>
            精选模板 · One click to apply professional-grade prompts to GPT-image2
          </p>
        </div>
        <button className="text-white/65 hover:text-white flex items-center gap-1.5 transition" style={{ fontSize: 13 }}>
          See all · 查看全部 <ArrowRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {visible.map((p, i) => (
          <div
            key={p.title}
            className="group relative rounded-2xl overflow-hidden glass-strong hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            style={{ animation: `fade-up 0.6s ease ${i * 0.06}s both` }}
          >
            <div className="aspect-[3/4] relative overflow-hidden">
              <img src={presets[i % presets.length].url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <span className="absolute top-2.5 right-2.5 glass rounded-md px-2 py-0.5" style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#fef3c7' }}>
                {p.uses ? `${Math.round(p.uses / 1000)}k uses` : presets[i % presets.length].tag}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3.5">
              <div className="flex items-baseline gap-2 mb-1">
                <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
                <span className="text-white/40" style={{ fontSize: 11 }}>{p.cn}</span>
              </div>
              <p className="text-white/55 line-clamp-2 mb-3" style={{ fontSize: 11, lineHeight: 1.4 }}>
                {p.desc}
              </p>
              <button
                onClick={async () => {
                  const data = p.id.startsWith('fallback') ? { prompt: p.prompt } : await usePromptPreset(p.id);
                  remix({ prompt: data.prompt });
                }}
                className="w-full glass rounded-xl py-1.5 flex items-center justify-center gap-1.5 group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-pink-500 transition"
                style={{ fontSize: 11.5, fontWeight: 500 }}
              >
                <Wand2 size={12} /> Use Prompt
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
