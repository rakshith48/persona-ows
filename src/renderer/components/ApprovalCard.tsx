interface ApprovalRequest {
  request_id: string
  item_name: string
  merchant: string
  subtotal: number
  fees: number
  total: number
  wallet_balance: number
}

interface ApprovalCardProps {
  request: ApprovalRequest
  onRespond: (requestId: string, approved: boolean) => void
}

export function ApprovalCard({ request, onRespond }: ApprovalCardProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-700 rounded-t-2xl w-full max-w-md p-6 space-y-4
                      animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Confirm Purchase</div>
          <div className="text-lg font-semibold text-white">{request.merchant}</div>
        </div>

        {/* Item */}
        <div className="bg-neutral-800 rounded-xl p-4">
          <div className="text-sm text-neutral-100 font-medium">{request.item_name}</div>
        </div>

        {/* Price breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span>${request.subtotal.toFixed(2)}</span>
          </div>
          {request.fees > 0 && (
            <div className="flex justify-between text-neutral-400">
              <span>Fees</span>
              <span>${request.fees.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-neutral-700 pt-2 flex justify-between text-white font-semibold">
            <span>Total</span>
            <span>${request.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Wallet balance */}
        <div className="flex justify-between text-xs text-neutral-500 bg-neutral-800/50 rounded-lg px-3 py-2">
          <span>Tempo Wallet</span>
          <span>${request.wallet_balance.toFixed(2)} USDC</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onRespond(request.request_id, false)}
            className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300
                       font-medium transition-colors text-sm"
          >
            Deny
          </button>
          <button
            onClick={() => onRespond(request.request_id, true)}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white
                       font-medium transition-colors text-sm"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
