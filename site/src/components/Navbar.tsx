import { useState, useEffect } from 'react'
import { LogoFull } from './Logo'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-b border-neutral-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="hover:opacity-80 transition-opacity">
          <LogoFull />
        </a>
        <a
          href="#waitlist"
          className="px-5 py-2 bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20 text-gold-400 font-body text-xs uppercase tracking-widest rounded-lg transition-colors"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  )
}
