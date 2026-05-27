import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 mt-4 md:mt-10 pb-24 md:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12 grid grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <Logo />
          <p className="text-white/45 mt-4 max-w-[320px]" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            ImageNova AI 是基于 GPT-image2 的图像创作平台，帮助每个创作者释放想象力。
          </p>
          <div className="flex items-center gap-2 mt-5">
            <span className="glass rounded-md px-2 py-1" style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#a78bfa' }}>
              v2.4.1 · 图像引擎
            </span>
            <span className="glass rounded-md px-2 py-1 flex items-center gap-1" style={{ fontSize: 10 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 系统运行正常
            </span>
          </div>
        </div>
        {[
          { t: '产品', items: ['生成图片', '公共图库', '提示词广场', '我的作品', '接口能力'] },
          { t: '社区', items: ['创作者社区', '小红书', 'B 站', '作品展示', '活动合作'] },
          { t: '关于', items: ['关于我们', '加入我们', '媒体资料', '更新日志', '联系我们'] },
          { t: '法律', items: ['服务条款', '隐私政策', '版权说明', '内容规范', '使用协议'] },
        ].map((col) => (
          <div key={col.t}>
            <div className="flex items-baseline gap-2 mb-4">
              <span style={{ fontSize: 13, fontWeight: 600 }}>{col.t}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {col.items.map((i) => (
                <a key={i} href="#" className="text-white/55 hover:text-white transition" style={{ fontSize: 12 }}>{i}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-5 px-4 md:px-8 max-w-[1440px] mx-auto flex flex-col md:flex-row gap-2 md:items-center justify-between text-white/35" style={{ fontSize: 11.5 }}>
        <span>© 2026 ImageNova AI · 上海星云智能科技有限公司</span>
        <span>上海出品 · 为创作者而建</span>
      </div>
    </footer>
  );
}
