import { useScrollReveal } from '../hooks/useScrollReveal'

const features = [
  {
    title: 'Talk to Buy',
    desc: 'Real speech-to-text runs locally on your device. No cloud, no latency — just say what you need and Persona handles the rest.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'Thinks Ahead',
    desc: 'Reads your calendar, learns your habits, and suggests purchases before you even ask. Coffee before your meeting. Reorders before you run out.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    title: 'Learns You',
    desc: 'Remembers your preferences, analyzes spending patterns, and gets smarter with every purchase. Upload a bank statement and it spots what to reorder.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: 'You Approve',
    desc: 'Nothing ships without your explicit say-so. Every purchase surfaces a clear cost breakdown. Your wallet, your keys, your control.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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
