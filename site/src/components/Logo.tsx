export function Logo({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer diamond frame */}
      <path
        d="M24 2L44 24L24 46L4 24L24 2Z"
        stroke="url(#gold-gradient)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner abstract "P" formed by geometric cuts */}
      <path
        d="M18 14V34M18 14H28C31.3137 14 34 16.6863 34 20V20C34 23.3137 31.3137 26 28 26H18"
        stroke="url(#gold-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small accent dot */}
      <circle cx="28" cy="20" r="2" fill="#D4A853" opacity="0.6" />
      <defs>
        <linearGradient id="gold-gradient" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5DEB3" />
          <stop offset="0.5" stopColor="#D4A853" />
          <stop offset="1" stopColor="#B8912F" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={28} />
      <span className="font-display text-xl text-white italic">Persona</span>
    </div>
  )
}
