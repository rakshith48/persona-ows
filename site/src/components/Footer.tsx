import { LogoFull } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-neutral-800/40 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <LogoFull />
        <div className="text-xs text-neutral-600 font-body">
          &copy; {new Date().getFullYear()} Persona. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
