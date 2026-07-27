import { useState, useEffect } from 'react'
import { Sparkles, User } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AppProvider, useAppContext } from './AppContext'
import { ToastProvider } from './components/Toast'
import { ViewModeProvider } from './components/ViewModeContext'
import { BottomNav, type TabType } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Sales, type ViewTab } from './pages/Sales'
import { Purchases } from './pages/Purchases'
import { Accounting } from './pages/Accounting'
import { Profile } from './pages/Profile'
import { Login } from './pages/Login'
import { motion, AnimatePresence } from 'framer-motion'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [salesViewOverride, setSalesViewOverride] = useState<ViewTab | null>(null)
  const [replenishmentProductId, setReplenishmentProductId] = useState<string | null>(null)
  const { loading } = useAppContext()

  const openPendingOrders = () => {
    setActiveTab('sales')
    setSalesViewOverride('pedidos')
  }

  const handleReplenish = (productId: string) => {
    setReplenishmentProductId(productId)
    setActiveTab('purchases')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-lilac-300 border-t-lilac-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      <div className="flex-1 lg:ml-64 min-h-screen relative overflow-hidden pb-28 lg:pb-0">
        {/* Header móvil */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-lilac-600" />
            <span className="font-bold text-slate-800">Mi Negocio</span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className={`p-2 rounded-xl transition-colors ${
              activeTab === 'profile'
                ? 'bg-lilac-100 text-lilac-600'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={20} />
          </button>
        </div>

        <div className="max-w-6xl mx-auto h-full pt-14 lg:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard onOpenPedidos={openPendingOrders} onReplenish={handleReplenish} />
              )}
              {activeTab === 'inventory' && <Inventory />}
              {activeTab === 'sales' && (
                <Sales
                  forcedView={salesViewOverride}
                  onForcedViewApplied={() => setSalesViewOverride(null)}
                />
              )}
              {activeTab === 'purchases' && (
                <Purchases
                  preselectedProductId={replenishmentProductId}
                  onProductSelected={() => setReplenishmentProductId(null)}
                />
              )}
              {activeTab === 'accounting' && <Accounting />}
              {activeTab === 'profile' && <Profile />}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </div>
  )
}

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-lilac-300 border-t-lilac-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ToastProvider>
      <ViewModeProvider>
        {!session ? (
          <Login />
        ) : (
          <AppProvider>
            <AppContent />
          </AppProvider>
        )}
      </ViewModeProvider>
    </ToastProvider>
  )
}
