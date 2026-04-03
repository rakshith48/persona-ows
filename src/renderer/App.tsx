import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { ChatPage } from './pages/ChatPage'
import { OrdersPage } from './pages/OrdersPage'
import { WalletPage } from './pages/WalletPage'
import { SettingsPage } from './pages/SettingsPage'
import { OnboardingPage } from './pages/OnboardingPage'

export function App() {
  const [ready, setReady] = useState(false)
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    window.persona.getSetting('onboarding_complete').then((val) => {
      setOnboarded(val === 'true')
      setReady(true)
    })
  }, [])

  const completeOnboarding = useCallback(() => {
    setOnboarded(true)
    window.persona.setSetting('onboarding_complete', 'true')
  }, [])

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-950 text-neutral-500 text-sm">
        <span className="animate-pulse">Starting Persona...</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-neutral-950">
        {/* Draggable title bar */}
        <div className="drag-region h-8 flex-shrink-0" />

        {/* Page content */}
        <div className="flex-1 flex flex-col min-h-0">
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage onComplete={completeOnboarding} />} />
            <Route path="/" element={onboarded ? <ChatPage /> : <Navigate to="/onboarding" replace />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>

        {/* Bottom navigation */}
        <nav className="no-drag flex-shrink-0 border-t border-neutral-800/50 flex">
          <NavTab to="/" icon={ChatIcon} label="Chat" />
          <NavTab to="/orders" icon={OrdersIcon} label="Orders" />
          <NavTab to="/wallet" icon={WalletIcon} label="Wallet" />
          <NavTab to="/settings" icon={SettingsIcon} label="Settings" />
        </nav>
      </div>
    </BrowserRouter>
  )
}

function NavTab({ to, icon: Icon, label }: { to: string; icon: React.FC<{ className?: string }>; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
          isActive ? 'text-blue-400' : 'text-neutral-500 hover:text-neutral-300'
        }`
      }
    >
      <Icon className="w-5 h-5 mb-0.5" />
      {label}
    </NavLink>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
    </svg>
  )
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" x2="21" y1="6" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
