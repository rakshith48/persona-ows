import { useScrollReveal } from '../hooks/useScrollReveal'

const features = [
  {
    title: 'Voice-First AI',
    desc: 'Chat naturally with an AI that understands what you want to buy. No browsing, no endless tabs — just say it.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    title: 'Crypto Wallet',
    desc: 'Built-in USDC wallet on Base. Fund it with any crypto — it auto-converts. No credit cards, no middlemen.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008M21 12v-2.25M21 12v2.25m0 0a2.25 2.25 0 01-2.25 2.25H15a3 3 0 100 6h.008M21 14.25v2.25M3 12V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5V12M3 12v4.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 16.5V12M3 12h18" />
      </svg>
    ),
  },
  {
    title: 'Human Approval',
    desc: 'Nothing ships without your say-so. Every purchase surfaces a clear cost breakdown for your explicit approval.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Order Tracking',
    desc: 'Track every purchase from approval to delivery. Full order history, real-time status, all in one place.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
]

export function Features() {
  const ref = useScrollReveal()

  return (
    <section className="py-16 sm:py-20 px-6">
      <div ref={ref} className="reveal max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[13px] font-body uppercase tracking-[0.25em] text-gold-500/70 mb-3 block">
            Features
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-white">
            Built for <span className="italic text-gold-300">effortless</span> buying.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className={`reveal reveal-delay-${i + 1} group relative overflow-hidden bg-[#151515] border border-neutral-700/50 rounded-xl p-7 hover:border-gold-500/25 transition-all duration-500`}
            >
              {/* Hover glow */}
              <div
                className="absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.1), transparent 70%)' }}
              />

              <div className="relative z-10">
                <div className="w-11 h-11 rounded-lg bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-display text-xl text-white mb-2 italic font-medium">{feat.title}</h3>
                <p className="font-body text-sm text-neutral-300 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
