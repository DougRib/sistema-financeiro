export function MiniFinancialChart() {
  return (
    <div className="relative h-16 w-full overflow-hidden">
      {/* Gold glow background */}
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#d4af6a]/12 to-transparent blur-2xl pointer-events-none" />

      <svg
        viewBox="0 0 300 80"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c879" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#b8893f" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e6c879" />
            <stop offset="100%" stopColor="#d4a857" />
          </linearGradient>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Filled area */}
        <path
          d="M0,60
             C40,65 60,40 90,55
             C120,70 150,20 180,45
             C210,70 240,10 300,5
             V80 H0 Z"
          fill="url(#goldArea)"
        />

        {/* Glowing line */}
        <path
          d="M0,60
             C40,65 60,40 90,55
             C120,70 150,20 180,45
             C210,70 240,10 300,5"
          fill="none"
          stroke="url(#goldLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#goldGlow)"
        />

        {/* Pulse dots */}
        <circle cx="90" cy="55" r="3.5" fill="#fff5dc" className="animate-pulse" />
        <circle cx="180" cy="45" r="3.5" fill="#fff5dc" className="animate-pulse" />
        <circle cx="294" cy="5" r="3.5" fill="#fff5dc" className="animate-pulse" />
      </svg>

      {/* Vertical grid */}
      <div className="absolute inset-0 flex justify-between pointer-events-none px-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-px h-full bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
