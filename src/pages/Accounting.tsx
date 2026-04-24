import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { ArrowUpRight, ArrowDownRight, DollarSign, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
export function Accounting() {
  const { accounting } = useAppContext();
  const [filter, setFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };
  const totalIngresos = accounting.
  filter((a) => a.type === 'ingreso').
  reduce((sum, a) => sum + a.amount, 0);
  const totalEgresos = accounting.
  filter((a) => a.type === 'egreso').
  reduce((sum, a) => sum + a.amount, 0);
  const balance = totalIngresos - totalEgresos;
  const filteredEntries = accounting.filter(
    (a) => filter === 'todos' || a.type === filter
  );
  return (
    <div className="h-full flex flex-col">
      <div className="bg-slate-800 p-6 pb-8 rounded-b-3xl shadow-md z-10 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Contabilidad</h1>
          <button className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors">
            <Plus size={20} />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-slate-300 text-sm mb-1">Balance General</p>
          <p
            className={`text-4xl font-bold ${balance >= 0 ? 'text-white' : 'text-pink-300'}`}>
            
            {formatCurrency(balance)}
          </p>
        </div>

        <div className="flex justify-center gap-6 max-w-xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-5 flex items-center gap-4 flex-1">
            <div className="bg-green-400/20 p-3 rounded-xl text-green-400">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-300">Ingresos</p>
              <p className="font-bold text-lg">
                {formatCurrency(totalIngresos)}
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 flex items-center gap-4 flex-1">
            <div className="bg-pink-400/20 p-3 rounded-xl text-pink-400">
              <ArrowDownRight size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-300">Egresos</p>
              <p className="font-bold text-lg">
                {formatCurrency(totalEgresos)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
        <div className="flex gap-2 mb-4">
          {(['todos', 'ingreso', 'egreso'] as const).map((f) =>
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            
              {f}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEntries.map((entry) =>
          <motion.div
            key={entry.id}
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            
              <div className="flex items-center gap-3">
                <div
                className={`p-2 rounded-xl ${entry.type === 'ingreso' ? 'bg-green-50 text-green-500' : 'bg-pink-50 text-pink-500'}`}>
                
                  {entry.type === 'ingreso' ?
                <ArrowUpRight size={18} /> :

                <ArrowDownRight size={18} />
                }
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {entry.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {entry.category} •{' '}
                    {new Date(entry.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
              <p
              className={`font-bold ${entry.type === 'ingreso' ? 'text-green-600' : 'text-slate-800'}`}>
              
                {entry.type === 'ingreso' ? '+' : '-'}
                {formatCurrency(entry.amount)}
              </p>
            </motion.div>
          )}

          {filteredEntries.length === 0 &&
          <div className="text-center py-10 text-slate-400">
              <p>No hay movimientos registrados.</p>
            </div>
          }
        </div>
      </div>
    </div>);

}