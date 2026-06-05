export function MiniFinancialChart() {
  return (
    <div className="relative h-16 w-full overflow-hidden">
      {/* Glow de fundo (Neblina verde) */}
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />

      <svg
        viewBox="0 0 300 80"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradiente da Área Preenchida */}
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>

          {/* Filtro de Glow para a linha e pontos */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Área preenchida com curvas suavizadas (Cubic Bézier) */}
        <path
          d="M0,60 
             C40,65 60,40 90,55 
             C120,70 150,20 180,45 
             C210,70 240,10 300,5 
             V80 H0 Z"
          fill="url(#areaGradient)"
        />

        {/* Linha principal brilhante */}
        <path
          d="M0,60 
             C40,65 60,40 90,55 
             C120,70 150,20 180,45 
             C210,70 240,10 300,5"
          fill="none"
          stroke="#4FFFE3"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Pontos de Destaque nos picos e vales */}
        <circle cx="90" cy="55" r="3.5" fill="white" className="animate-pulse" />
        <circle cx="180" cy="45" r="3.5" fill="white" className="animate-pulse" />
        <circle cx="294" cy="5" r="3.5" fill="white" className="animate-pulse" />
      </svg>

      {/* Grid vertical (Fora do SVG para controle total do Tailwind) */}
      <div className="absolute inset-0 flex justify-between pointer-events-none px-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-px h-full bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}

