import { useState, useRef, useCallback, useEffect } from 'react'

type VoiceState = 'idle' | 'listening' | 'loading'

export function useVoice(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>('idle')
  const transcriber = useRef<any>(null)
  const initialized = useRef(false)

  // Initialize Moonshine on first use
  const initMoonshine = useCallback(async () => {
    if (initialized.current) return true
    try {
      setState('loading')
      const Moonshine = await import('@moonshine-ai/moonshine-js')
      transcriber.current = new Moonshine.MicrophoneTranscriber(
        'model/tiny',
        {
          onTranscriptionCommitted(text: string) {
            const trimmed = text.trim()
            if (trimmed) {
              onTranscript(trimmed)
              setState('idle')
            }
          },
        },
      )
      initialized.current = true
      setState('idle')
      return true
    } catch (err) {
      console.error('Moonshine init failed:', err)
      setState('idle')
      return false
    }
  }, [onTranscript])

  const toggle = useCallback(async () => {
    if (state === 'listening') {
      // Stop listening
      transcriber.current?.stop()
      setState('idle')
      return
    }

    // Initialize if needed
    if (!initialized.current) {
      const ok = await initMoonshine()
      if (!ok) {
        // Fallback: use Web Speech API
        fallbackWebSpeech(onTranscript, setState)
        return
      }
    }

    // Start listening
    try {
      await transcriber.current?.start()
      setState('listening')
    } catch (err) {
      console.error('Mic start failed:', err)
      // Fallback to Web Speech API
      fallbackWebSpeech(onTranscript, setState)
    }
  }, [state, initMoonshine, onTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      transcriber.current?.stop()
    }
  }, [])

  return { state, toggle }
}

/** Fallback: Web Speech API (built into Chromium) */
function fallbackWebSpeech(
  onTranscript: (text: string) => void,
  setState: (s: VoiceState) => void,
) {
  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!SpeechRecognition) {
    alert('Speech recognition not available')
    return
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-AU'

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript
    if (text.trim()) onTranscript(text.trim())
    setState('idle')
  }

  recognition.onerror = () => setState('idle')
  recognition.onend = () => setState('idle')

  recognition.start()
  setState('listening')
}
