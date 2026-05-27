import { ArrowRight, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPromptPresets, PromptPreset, usePromptPreset } from '../lib/imageApi';
import { useStore } from '../lib/store';

const presets = [
  { title: '产品爆炸图', cn: '硬件海报', desc: '高科技 VR 头显组件拆解海报', url: '/assets/showcase/1776658772018-lukyfw-hgsufldbiaeimwz-b0eb3f27.jpg', tag: '已使用 18k 次' },
  { title: '美食地图', cn: '旅行信息图', desc: '手绘水彩城市美食旅游地图', url: '/assets/showcase/1776662673014-nf0taw-hgrmndybsaagg88-72e7da42.jpg', tag: '已使用 17k 次' },
  { title: '直播样机', cn: '电商界面', desc: '电商直播间叠层 UI 与购买卡片', url: '/assets/showcase/1776699445498-ga2ry5-hgo7h0dwkaapdkk-ab96ec6c.jpg', tag: '已使用 16k 次' },
  { title: '动漫动作', cn: '战斗场景', desc: '传统道场中的动态武术对决', url: '/assets/showcase/1776756799880-c8u8w7-hgukjjaasaavvra-a99be45a.jpg', tag: '已使用 15k 次' },
  { title: '教育信息图', cn: '三维时间线', desc: '石阶式演化时间线信息图', url: '/assets/showcase/1776661968404-8a5flm-hgqc-koamaa2vt0-0d1ee4bb.jpg', tag: '已使用 14k 次' },
  { title: '赛博头像', cn: '霓虹肖像', desc: '霓虹眼镜与 HUD 投影肖像', url: '/assets/showcase/1778921891612-x61gjv-hix-aadakaqoycj-dd3480e1.jpg', tag: '已使用 13k 次' },
];

export function PromptPresets() {
  const [items, setItems] = useState<PromptPreset[]>([]);
  const { remix, setActiveNav, setView } = useStore();

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
    <section id="prompts-section" className="relative max-w-[1440px] mx-auto px-4 md:px-8 pb-14 md:pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-300 to-pink-400" />
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#f472b6', letterSpacing: '0.15em' }}>
              提示词模板
            </span>
          </div>
          <h2 className="section-title" style={{ fontSize: 36, fontWeight: 700 }}>
            从 <span className="text-gradient">精选提示词</span> 开始
          </h2>
          <p className="text-white/55 mt-2" style={{ fontSize: 14 }}>
            精选专业模板，一键套用到 GPT-image2。
          </p>
        </div>
        <button
          onClick={() => {
            setActiveNav('prompts');
            setView('prompts');
            requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
          }}
          className="text-white/65 hover:text-white flex items-center gap-1.5 transition"
          style={{ fontSize: 13 }}
        >
          查看全部 <ArrowRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
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
                {p.uses ? `已使用 ${Math.round(p.uses / 1000)}k 次` : presets[i % presets.length].tag}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3.5">
              <div className="flex items-baseline gap-2 mb-1">
                <span style={{ fontSize: 14, fontWeight: 600 }}>{p.cn || p.title}</span>
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
                <Wand2 size={12} /> 使用提示词
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
