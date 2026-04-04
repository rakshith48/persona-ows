export function Hero() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-20 overflow-hidden px-6">
      {/* Background radial glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.06) 0%, rgba(212,168,83,0.02) 40%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col lg:flex-row lg:justify-between gap-12 lg:gap-16 items-center">
        {/* Left: Copy */}
        <div>
          <div className="hero-animate hero-delay-1 inline-block mb-5">
            <span className="text-[13px] font-body uppercase tracking-[0.25em] text-gold-500 border border-gold-500/20 rounded-full px-4 py-1.5">
              AI Purchasing Agent
            </span>
          </div>

          <h1 className="hero-animate hero-delay-2 font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-5">
            Your AI buys
            <br />
            <span className="italic text-gold-400">it for you.</span>
          </h1>

          <p className="hero-animate hero-delay-3 font-body text-lg text-neutral-400 leading-relaxed max-w-md mb-8">
            Tell Persona what you need. It searches the best deals, you approve with one tap, and it handles the rest — paid with crypto, delivered to your door.
          </p>

          <div className="hero-animate hero-delay-4 flex flex-col sm:flex-row gap-3">
            <a
              href="#waitlist"
              className="glow-cta inline-flex items-center justify-center px-8 py-3.5 bg-gold-500 hover:bg-gold-400 text-[#0A0A0A] font-body font-semibold text-sm tracking-wide rounded-lg transition-colors"
            >
              Join the Waitlist
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-body text-sm tracking-wide rounded-lg transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Right: Chat mockup — visually anchored */}
        <div className="hero-animate hero-delay-4 hidden lg:block flex-shrink-0">
          <div className="relative w-[340px]">
            {/* Phone frame */}
            <div className="bg-[#131313] border border-neutral-700/60 rounded-2xl p-5 shadow-2xl shadow-black/60">
              {/* Status bar */}
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="text-[10px] text-neutral-500 font-body">9:41</div>
                <div className="text-xs font-body text-neutral-300 font-medium tracking-wide">Persona</div>
                <div className="flex gap-1">
                  <div className="w-3.5 h-2 border border-neutral-500 rounded-sm">
                    <div className="w-2/3 h-full bg-green-400 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-2.5 mb-5">
                <div className="ml-auto max-w-[80%] bg-blue-600 text-white text-[13px] px-3.5 py-2 rounded-2xl rounded-br-md font-body">
                  Order me a USB-C hub for my MacBook
                </div>
                <div className="max-w-[85%] bg-neutral-800 text-neutral-100 text-[13px] px-3.5 py-2 rounded-2xl rounded-bl-md font-body">
                  Found 3 options on Amazon. The best rated is the Anker 7-in-1 for <span className="text-ice-400 font-medium">$29.99</span>. Want me to order it?
                </div>
                <div className="ml-auto max-w-[80%] bg-blue-600 text-white text-[13px] px-3.5 py-2 rounded-2xl rounded-br-md font-body">
                  Yes, go ahead
                </div>
                <div className="max-w-[85%] bg-neutral-800 text-neutral-200 text-[13px] px-3.5 py-2 rounded-2xl rounded-bl-md font-body flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-neutral-400">Processing order</span>
                  <span className="cursor-blink text-gold-400">|</span>
                </div>
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-neutral-800/80 rounded-lg px-3.5 py-2 text-[13px] text-neutral-500 font-body">
                  Ask Persona to buy something...
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l7-7 7 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Decorative glow behind phone */}
            <div
              className="absolute -inset-6 -z-10 rounded-2xl"
              style={{
                background: 'radial-gradient(circle at 50% 40%, rgba(212,168,83,0.07), transparent 60%)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
