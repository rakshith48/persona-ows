import { useState, useCallback } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { supabase } from '../lib/supabase'

export function Waitlist() {
  const ref = useScrollReveal()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim().toLowerCase()
      if (!trimmed) return

      setStatus('loading')
      try {
        if (!supabase) {
          setStatus('error')
          setMessage('Waitlist is not configured yet. Check back soon!')
          return
        }

        // Check for duplicate
        const { data: existing } = await supabase
          .from('waitlist')
          .select('id')
          .eq('email', trimmed)
          .maybeSingle()

        if (existing) {
          setStatus('error')
          setMessage('This email is already on the waitlist.')
          return
        }

        // Insert new signup
        const { error } = await supabase
          .from('waitlist')
          .insert({ email: trimmed })

        if (error) throw error

        setStatus('success')
        setMessage("You're on the list. We'll be in touch.")
        setEmail('')
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Try again later.')
      }
    },
    [email]
  )

  return (
    <section id="waitlist" className="py-28 px-6 relative">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.05) 0%, transparent 60%)',
        }}
      />

      <div ref={ref} className="reveal relative z-10 max-w-lg mx-auto text-center">
        <span className="text-xs font-body uppercase tracking-[0.25em] text-gold-500/70 mb-4 block">
          Early Access
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">
          Get in <span className="italic text-gold-300">early.</span>
        </h2>
        <p className="font-body text-neutral-400 mb-10 leading-relaxed">
          Persona is coming soon. Join the waitlist and be first to experience AI-powered purchasing.
        </p>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-5">
            <div className="text-green-400 font-body font-medium mb-1">You're in.</div>
            <div className="text-sm text-green-400/70 font-body">{message}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              placeholder="you@example.com"
              className="flex-1 bg-[#111] border border-neutral-800 hover:border-neutral-700 focus:border-gold-500/50 rounded-xl px-5 py-4 text-white font-body text-sm placeholder-neutral-600 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="glow-cta px-8 py-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-[#0A0A0A] font-body font-semibold text-sm tracking-wide rounded-xl transition-colors flex-shrink-0"
            >
              {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <div className="mt-3 text-sm text-red-400 font-body">{message}</div>
        )}

        <p className="mt-6 text-xs text-neutral-600 font-body">
          No spam. We'll only email you when Persona is ready.
        </p>
      </div>
    </section>
  )
}
