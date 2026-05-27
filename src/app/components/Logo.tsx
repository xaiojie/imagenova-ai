export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          <defs>
            <radialGradient id="logoGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="30%" stopColor="#f472b6" />
              <stop offset="70%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" stroke="url(#ringGrad)" strokeWidth="1.5" opacity="0.7" />
          <circle cx="20" cy="20" r="12" fill="url(#logoGrad)" />
          <circle cx="14" cy="14" r="1.6" fill="white" opacity="0.9" />
          <circle cx="27" cy="11" r="0.9" fill="white" opacity="0.7" />
          <circle cx="29" cy="24" r="1.1" fill="white" opacity="0.8" />
          <circle cx="20" cy="20" r="19" stroke="url(#ringGrad)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
          ImageNova
        </span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.2em', color: '#a78bfa', marginTop: 2 }}>
          AI 图像引擎
        </span>
      </div>
    </div>
  );
}
