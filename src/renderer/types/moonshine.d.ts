declare module '@moonshine-ai/moonshine-js' {
  export class MicrophoneTranscriber {
    constructor(
      model: string,
      callbacks: {
        onTranscriptionCommitted?: (text: string) => void
        onTranscriptionUpdated?: (text: string) => void
      },
      useVAD?: boolean,
    )
    start(): Promise<void>
    stop(): void
  }

  export class MoonshineSpeechRecognition {
    addEventListener(event: string, cb: (e: any) => void): void
    start(): void
    stop(): void
  }
}
