import { useEffect, useRef } from 'react'

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Observe the container itself and all .reveal children
    const targets = [container, ...container.querySelectorAll('.reveal')]

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold }
    )

    for (const el of targets) observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return ref
}
