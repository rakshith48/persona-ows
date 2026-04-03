import { useScrollReveal } from '../hooks/useScrollReveal'

const points = [
  {
    title: 'Your keys, your wallet',
    desc: 'Private keys are generated and stored locally on your device. Persona never has custody of your funds.',
  },
  {
    title: 'Approve before anything ships',
    desc: 'Every purchase requires explicit human approval. You see exactly what you\'re paying before a single cent moves.',
  },
  {
    title: 'No data harvesting',
    desc: 'Conversations and order history stay on your machine. We don\'t sell your data or build ad profiles.',
  },
]

export function Trust() {
  const ref = useScrollReveal()

  return (
    <section className="py-28 px-6">
      <div ref={ref} className="reveal max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-body uppercase tracking-[0.25em] text-gold-500/70 mb-4 block">
            Trust & Security
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-white">
            You stay <span className="italic text-gold-300">in control.</span>
          </h2>
        </div>

        <div className="space-y-0">
          {points.map((pt, i) => (
            <div
              key={pt.title}
              className={`reveal reveal-delay-${i + 1} flex gap-6 py-8 ${
                i < points.length - 1 ? 'border-b border-neutral-800/50' : ''
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-xl text-white mb-1.5 italic">{pt.title}</h3>
                <p className="font-body text-sm text-neutral-400 leading-relaxed">{pt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
