import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Calculator,
  Sparkles,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { TabType } from './BottomNav'

interface SidebarProps {
  activeTab: TabType
  onChangeTab: (tab: TabType) => void
}

export function Sidebar({ activeTab, onChangeTab }: SidebarProps) {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory',
      label: 'Inventario',
      icon: Package,
    },
    {
      id: 'sales',
      label: 'Ventas',
      icon: ShoppingCart,
    },
    {
      id: 'purchases',
      label: 'Compras',
      icon: Truck,
    },
    {
      id: 'accounting',
      label: 'Contabilidad',
      icon: Calculator,
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: User,
    },
  ] as const

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40">
      <div className="p-6 flex items-center gap-3 border-b border-slate-50">
        <div className="bg-lilac-100 p-2 rounded-xl text-lilac-600">
          <Sparkles size={24} />
        </div>
        <h1 className="font-bold text-lg text-slate-800">Mi Negocio</h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as TabType)}
              className="w-full relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group text-left"
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebarTab"
                  className="absolute inset-0 bg-lilac-50 rounded-xl"
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <Icon
                size={20}
                className={`relative z-10 transition-colors ${isActive ? 'text-lilac-600' : 'text-slate-400 group-hover:text-slate-600'}`}
              />
              <span
                className={`relative z-10 font-medium transition-colors ${isActive ? 'text-lilac-700' : 'text-slate-500 group-hover:text-slate-700'}`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="p-6 border-t border-slate-50">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs text-slate-500 text-center">
            App de Gestión v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
