import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Calculator } from
'lucide-react';
import { motion } from 'framer-motion';
export type TabType =
'dashboard' |
'inventory' |
'sales' |
'purchases' |
'accounting';
interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}
export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: LayoutDashboard
  },
  {
    id: 'inventory',
    label: 'Stock',
    icon: Package
  },
  {
    id: 'sales',
    label: 'Vender',
    icon: ShoppingCart
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: Truck
  },
  {
    id: 'accounting',
    label: 'Cuentas',
    icon: Calculator
  }] as
  const;
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-white via-white to-transparent z-50 lg:hidden pointer-events-none">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-lilac-100 p-2 flex justify-between items-center relative overflow-hidden pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as TabType)}
              className="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl z-10">
              
              {isActive &&
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-lilac-100 rounded-xl"
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }} />

              }
              <Icon
                size={22}
                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-lilac-600' : 'text-slate-400'}`} />
              
              <span
                className={`text-[10px] mt-1 font-medium relative z-10 transition-colors duration-300 ${isActive ? 'text-lilac-700' : 'text-slate-400'}`}>
                
                {tab.label}
              </span>
            </button>);

        })}
      </div>
    </div>);

}