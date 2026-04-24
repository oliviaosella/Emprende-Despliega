import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import { BottomNav, TabType } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Accounting } from './pages/Accounting';
import { motion, AnimatePresence } from 'framer-motion';
function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      <div className="flex-1 lg:ml-64 min-h-screen relative overflow-hidden pb-28 lg:pb-0">
        <div className="max-w-6xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              transition={{
                duration: 0.2
              }}
              className="h-full">
              
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'inventory' && <Inventory />}
              {activeTab === 'sales' && <Sales />}
              {activeTab === 'purchases' && <Purchases />}
              {activeTab === 'accounting' && <Accounting />}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </div>);

}
export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>);

}