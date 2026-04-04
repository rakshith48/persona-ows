import { useState, useEffect, useRef, useCallback } from 'react'
import { ApprovalCard } from '../components/ApprovalCard'
import { useVoice } from '../hooks/useVoice'

interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  streaming?: boolean
}

interface ApprovalRequest {
  request_id: string
  item_name: string
  merchant: string
  subtotal: number
  fees: number
  total: number
  wallet_balance: number
}

type AgentStatus = 'idle' | 'ready' | 'thinking' | 'searching' | 'purchasing' | 'done' | 'tool_calling'

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [statusDetail, setStatusDetail] = useState('')
  const [approval, setApproval] = useState<ApprovalRequest | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationContext, setNotificationContext] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from DB on mount
  useEffect(() => {
    window.persona.getConversations().then((rows) => {
      const loaded = (rows as { role: string; content: string }[]).map((row) => ({
        id: crypto.randomUUID(),
        role: row.role as 'user' | 'agent',
        text: row.content,
      }))
      if (loaded.length > 0) setMessages(loaded)
    })
  }, [])

  // Listen for agent messages
  useEffect(() => {
    const cleanup = window.persona.onAgentMessage((msg) => {
      if (msg.type === 'agent_text_delta') {
        // Streaming: append delta to the last agent message
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'agent' && last.streaming) {
            return [...prev.slice(0, -1), { ...last, text: last.text + (msg.text as string) }]
          }
          return [...prev, { id: crypto.randomUUID(), role: 'agent', text: msg.text as string, streaming: true }]
        })
        setStatus('idle')
      } else if (msg.type === 'agent_text') {
        const text = msg.text as string
        // Auto-open OAuth URLs (calendar auth etc)
        const oauthMatch = text.match(/(https:\/\/[^\s)]+authorize[^\s)]*)/i)
        if (oauthMatch) {
          window.persona.openUrl(oauthMatch[1])
        }
        // Complete message — finalize any streaming message, or add new one
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'agent' && last.streaming) {
            return [...prev.slice(0, -1), { ...last, text, streaming: false }]
          }
          return [...prev, { id: crypto.randomUUID(), role: 'agent', text }]
        })
        setStatus('idle')
        setStatusDetail('')
      } else if (msg.type === 'agent_status') {
        setStatus(msg.status as AgentStatus)
        if (msg.detail) setStatusDetail(msg.detail as string)
        if (msg.status === 'done') setStatusDetail('')
      } else if (msg.type === 'approval_request') {
        setApproval(msg as unknown as ApprovalRequest)
      } else if (msg.type === 'proactive_notification') {
        setNotification(msg.text as string)
      }
    })
    return cleanup
  }, [])

  const handleApprovalResponse = useCallback((requestId: string, approved: boolean) => {
    window.persona.respondToApproval(requestId, approved)
    setApproval(null)
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'agent',
        text: approved ? 'Purchase approved. Processing...' : 'Purchase denied.',
      },
    ])
    setStatus(approved ? 'purchasing' : 'thinking')
    setStatusDetail('')
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || status === 'thinking') return

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setStatus('thinking')
    window.persona.sendMessage(text)
    setInput('')
    inputRef.current?.focus()
  }, [input, status])

  // Voice input
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text)
    // Auto-send after voice input
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setStatus('thinking')
    window.persona.sendMessage(text)
  }, [])
  const voice = useVoice(handleVoiceTranscript)

  const isThinking = status === 'thinking' || status === 'searching' || status === 'purchasing' || status === 'tool_calling'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Proactive notification banner */}
      {notification && (
        <div className="mx-4 mt-2 bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex-shrink-0">
          <div className="text-sm text-amber-100 whitespace-pre-wrap">{notification}</div>
          <input
            type="text"
            value={notificationContext}
            onChange={(e) => setNotificationContext(e.target.value)}
            placeholder="Add details... (e.g. make it a large, add a muffin)"
            className="no-drag w-full mt-3 bg-neutral-800/80 text-white rounded-lg px-3 py-2 text-xs
                       placeholder-neutral-500 outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const fullText = notificationContext
                  ? `${notification}. Additional: ${notificationContext}`
                  : notification
                window.persona.proactiveApprove(fullText)
                setNotification(null)
                setNotificationContext('')
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
            >
              Yes, prep it
            </button>
            <button
              onClick={() => {
                window.persona.proactiveDismiss()
                setNotification(null)
                setNotificationContext('')
              }}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition-colors"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-3xl">🛒</div>
            <div className="text-neutral-500 text-sm text-center leading-relaxed">
              Tell me what you want to buy.<br />
              <span className="text-neutral-600 text-xs">
                "Order me an iced latte from Uber Eats"
              </span>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto bg-neutral-800 text-neutral-100'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isThinking && (
          <div className="mr-auto px-4 py-2.5 rounded-2xl bg-neutral-800 text-neutral-400 text-sm flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-neutral-500 text-xs">
              {statusDetail || (status === 'searching' ? 'Searching...' : status === 'purchasing' ? 'Purchasing...' : 'Thinking...')}
            </span>
          </div>
        )}
      </div>

      {/* Approval card overlay */}
      {approval && (
        <ApprovalCard request={approval} onRespond={handleApprovalResponse} />
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 p-3 border-t border-neutral-800/50">
        <div className="flex items-center gap-2">
          {/* Voice button */}
          <button
            onClick={voice.toggle}
            disabled={isThinking || voice.state === 'loading'}
            className={`no-drag flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              voice.state === 'listening'
                ? 'bg-red-500 text-white animate-pulse'
                : voice.state === 'loading'
                ? 'bg-neutral-800 text-neutral-500 opacity-50'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
            }`}
            title={voice.state === 'listening' ? 'Tap to stop' : 'Tap to speak'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Persona to buy something..."
            disabled={isThinking}
            className="no-drag flex-1 bg-neutral-800/80 text-white rounded-xl px-4 py-2.5 text-sm
                       placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500/50
                       disabled:opacity-50 transition-opacity"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="no-drag flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500
                       disabled:opacity-30 flex items-center justify-center transition-all text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 7-7 7 7"/>
              <path d="M12 19V5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
