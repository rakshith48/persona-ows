import type { PersonaAPI } from '../../preload/index'

declare global {
  interface Window {
    persona: PersonaAPI
  }
}

export {}
