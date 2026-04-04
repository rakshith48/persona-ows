import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  onComplete: () => void
}

export function OnboardingPage({ onComplete }: Props) {
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [depositUrl, setDepositUrl] = useState('')
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [showDeposit, setShowDeposit] = useState(false)
  const [loadingDeposit, setLoadingDeposit] = useState(false)
  const [copied, setCopied] = useState('')

  // Listen for OAuth URLs from the agent and auto-open them
  useEffect(() => {
    const cleanup = window.persona.onAgentMessage((msg) => {
      if (msg.type === 'agent_text' && typeof msg.text === 'string') {
        const match = (msg.text as string).match(/(https:\/\/[^\s)]+authorize[^\s)]*)/i)
        if (match) {
          window.persona.openUrl(match[1])
        }
      }
    })
    return cleanup
  }, [])

  // Load wallet info on mount
  useEffect(() => {
    window.persona.getWalletInfo().then((info) => {
      setAddress(info.address)
      setBalance(info.balance)
    })
  }, [])

  // Poll balance every 5s — only update if we get a real value
  useEffect(() => {
    const interval = setInterval(async () => {
      const info = await window.persona.getWalletInfo()
      if (info.address && !address) setAddress(info.address)
      // Only update balance if it's > current (prevents flicker from slow RPCs)
      setBalance((prev) => {
        if (prev === null) return info.balance
        return info.balance > prev ? info.balance : prev
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [address])

  const handleAddFunds = useCallback(async () => {
    setLoadingDeposit(true)
    const deposit = await window.persona.createDeposit()
    setDepositUrl(deposit.depositUrl)
    setAddresses(deposit.addresses)
    setShowDeposit(true)
    setLoadingDeposit(false)
  }, [])

  const handleContinue = useCallback(() => {
    onComplete()
    navigate('/')
  }, [onComplete, navigate])

  const copyAddress = useCallback((chain: string, addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(chain)
    setTimeout(() => setCopied(''), 2000)
  }, [])

  const displayBalance = balance ?? 0
  const hasFunds = displayBalance > 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">Persona</div>
        <div className="text-neutral-400 text-sm">Your AI purchasing agent</div>
      </div>

      {/* Wallet created */}
      <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <div className="text-xs text-neutral-400 uppercase tracking-wider">OWS Wallet Ready</div>
        </div>
        {address && (
          <div className="font-mono text-xs text-neutral-300 break-all">{address}</div>
        )}
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 mb-6 text-center">
        <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">USDC Balance</div>
        <div className="text-3xl font-bold text-white">${displayBalance.toFixed(2)}</div>
        {hasFunds && <div className="text-xs text-green-300 mt-1">Ready to shop</div>}
      </div>

      {/* Connect Calendar */}
      <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs text-neutral-400 uppercase tracking-wider">Google Calendar</div>
        </div>
        <div className="text-xs text-neutral-500 mb-3">
          Connect your calendar so Persona can proactively suggest purchases based on your schedule.
        </div>
        <button
          onClick={() => {
            window.persona.sendMessage('Check my Google Calendar to test the connection. Just list one upcoming event.')
          }}
          className="w-full py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-sm transition-colors"
        >
          Connect Google Calendar
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Always show Start Shopping */}
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          {hasFunds ? 'Start Shopping' : 'Continue to Chat'}
        </button>

        {/* Add Funds section */}
        {!showDeposit ? (
          <button
            onClick={handleAddFunds}
            disabled={loadingDeposit}
            className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50
                       text-neutral-300 font-medium transition-colors text-sm"
          >
            {loadingDeposit ? 'Setting up deposit...' : 'Add Funds'}
          </button>
        ) : (
          <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
            <div className="text-xs text-neutral-500">
              Send any crypto — auto-converts to USDC on Base.
            </div>
            {Object.entries(addresses).map(([chain, addr]) => (
              <button
                key={chain}
                onClick={() => copyAddress(chain, addr)}
                className="w-full bg-neutral-800 hover:bg-neutral-700 rounded-lg p-3 text-left transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-neutral-400 uppercase">{chain}</span>
                  <span className="text-[10px] text-neutral-500">
                    {copied === chain ? 'Copied!' : 'Click to copy'}
                  </span>
                </div>
                <div className="font-mono text-xs text-neutral-300 break-all">{addr}</div>
              </button>
            ))}
            {Object.keys(addresses).length === 0 && (
              <div className="text-neutral-500 text-xs text-center">
                Could not create deposit. You can send USDC directly to your wallet address above.
              </div>
            )}
            {depositUrl && (
              <button
                onClick={() => window.persona.openUrl(depositUrl)}
                className="w-full py-3 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white
                           font-medium transition-colors text-sm"
              >
                Buy USDC with MoonPay
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
