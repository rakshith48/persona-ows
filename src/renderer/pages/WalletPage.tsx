import { useState, useEffect, useCallback } from 'react'

export function WalletPage() {
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState(0)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositUrl, setDepositUrl] = useState('')
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState('')

  useEffect(() => {
    window.persona.getWalletInfo().then((info) => {
      setAddress(info.address)
      setBalance(info.balance)
    })
    const interval = setInterval(async () => {
      const info = await window.persona.getWalletInfo()
      setBalance(info.balance)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleAddFunds = useCallback(async () => {
    const deposit = await window.persona.createDeposit()
    setDepositUrl(deposit.depositUrl)
    setAddresses(deposit.addresses)
    setShowDeposit(true)
  }, [])

  const copyAddr = useCallback((chain: string, addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(chain)
    setTimeout(() => setCopied(''), 2000)
  }, [])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <h2 className="text-lg font-semibold text-white mb-4">Wallet</h2>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-4">
        <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">OWS Wallet</div>
        <div className="text-3xl font-bold text-white">${balance.toFixed(2)}</div>
        <div className="text-xs text-blue-200 mt-1">USDC on Base</div>
        {address && (
          <div className="font-mono text-[10px] text-blue-300/60 mt-2 break-all">{address}</div>
        )}
      </div>

      {/* Add Funds button */}
      <button
        onClick={handleAddFunds}
        className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white
                   font-medium transition-colors text-sm mb-4"
      >
        Add Funds
      </button>

      {/* Deposit UI */}
      {showDeposit && (
        <div className="space-y-3 mb-4">
          <div className="text-xs text-neutral-500">
            Send any crypto — auto-converts to USDC on Base.
          </div>
          {Object.entries(addresses).map(([chain, addr]) => (
            <button
              key={chain}
              onClick={() => copyAddr(chain, addr)}
              className="w-full bg-neutral-800 hover:bg-neutral-750 rounded-lg p-3 text-left transition-colors"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-neutral-400 uppercase">{chain}</span>
                <span className="text-[10px] text-neutral-500">
                  {copied === chain ? 'Copied!' : 'Tap to copy'}
                </span>
              </div>
              <div className="font-mono text-xs text-neutral-300 break-all">{addr}</div>
            </button>
          ))}
          {depositUrl && (
            <button
              onClick={() => window.persona.openUrl(depositUrl)}
              className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white
                         text-sm border border-neutral-700 transition-colors"
            >
              Buy USDC with MoonPay
            </button>
          )}
        </div>
      )}
    </div>
  )
}
