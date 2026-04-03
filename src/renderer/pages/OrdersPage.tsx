import { useState, useEffect } from 'react'

interface Order {
  id: string
  item_name: string
  price: number
  merchant: string
  status: string
  created_at: string
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    window.persona.getOrders().then((data) => setOrders(data as Order[]))
  }, [])

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400',
    approved: 'text-blue-400',
    placed: 'text-blue-400',
    shipped: 'text-purple-400',
    delivered: 'text-green-400',
    failed: 'text-red-400',
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <h2 className="text-lg font-semibold text-white mb-4">Orders</h2>

      {orders.length === 0 ? (
        <div className="text-neutral-500 text-sm text-center mt-12">
          No orders yet. Ask Persona to buy something!
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-white">{order.item_name}</div>
                  <div className="text-xs text-neutral-400">{order.merchant}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">${order.price.toFixed(2)}</div>
                  <div className={`text-xs capitalize ${statusColor[order.status] || 'text-neutral-400'}`}>
                    {order.status}
                  </div>
                </div>
              </div>
              <div className="text-xs text-neutral-600">
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
