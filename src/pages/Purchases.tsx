import React from 'react';
import { useAppContext } from '../AppContext';
import { Truck, Plus } from 'lucide-react';
export function Purchases() {
  const { purchases } = useAppContext();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Compras
          </h1>
          <button className="bg-lilac-100 text-lilac-600 p-2 rounded-xl hover:bg-lilac-200 transition-colors">
            <Plus size={20} />
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Registro de insumos y mercadería
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {purchases.map((purchase) =>
          <div
            key={purchase.id}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {purchase.supplier}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {new Date(purchase.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-slate-800">
                  {formatCurrency(purchase.total)}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Items comprados:
                </p>
                <div className="space-y-1">
                  {purchase.items.map((item, idx) =>
                <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.qty}x Producto {item.productId.replace('p', '')}
                      </span>
                      <span className="text-slate-400">
                        {formatCurrency(item.unitCost * item.qty)}
                      </span>
                    </div>
                )}
                </div>
              </div>
            </div>
          )}
        </div>

        {purchases.length === 0 &&
        <div className="text-center py-10 text-slate-400">
            <p>No hay compras registradas.</p>
          </div>
        }
      </div>
    </div>);

}