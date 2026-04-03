import { useScrollReveal } from '../hooks/useScrollReveal'

const steps = [
  {
    num: '01',
    title: 'Say it',
    desc: 'Tell Persona what you want in plain language — "Order me running shoes under $100" or "Get me the best-rated air purifier."',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Approve it',
    desc: 'Persona finds the best options and presents a clear breakdown — item, price, fees. You approve or deny with one tap.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Get it',
    desc: 'Persona places the order, pays with your crypto wallet, and tracks delivery. You just wait for the doorbell.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m0 0V5.625c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125v8.625m-12 0h12m0 0h1.5c.621 0 1.125.504 1.125 1.125v1.5" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  const ref = useScrollReveal()

  return (
    <section id="how-it-works" className="py-28 px-6">
      <div ref={ref} className="reveal max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-body uppercase tracking-[0.25em] text-gold-500/70 mb-4 block">
            How It Works
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-white">
            Three steps. <span className="italic text-gold-300">That's it.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`reveal reveal-delay-${i + 1} group relative bg-[#111] border border-neutral-800/60 rounded-2xl p-8 hover:border-gold-500/30 transition-all duration-500 hover:-translate-y-1`}
            >
              {/* Step number */}
              <div className="text-6xl font-display text-neutral-800/50 group-hover:text-gold-500/20 absolute top-4 right-6 transition-colors duration-500">
                {step.num}
              </div>

              <div className="relative z-10">
                <div className="text-gold-500 mb-5">{step.icon}</div>
                <h3 className="font-display text-2xl text-white mb-3 italic">{step.title}</h3>
                <p className="font-body text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
