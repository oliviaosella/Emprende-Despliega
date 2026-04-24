import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Search, Plus, Edit2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
export function Inventory() {
  const { products, updateProductStock } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const filteredProducts = products.filter(
    (p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };
  const handleEditStock = (id: string, currentStock: number) => {
    setEditingStockId(id);
    setTempStock(currentStock);
  };
  const handleSaveStock = (id: string) => {
    updateProductStock(id, tempStock);
    setEditingStockId(null);
  };
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Inventario
          </h1>
          <button className="bg-pink-100 text-pink-600 p-2 rounded-xl hover:bg-pink-200 transition-colors">
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18} />
          
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-all" />
          
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isLowStock = product.stock <= product.minStock;
            const isEditing = editingStockId === product.id;
            return (
              <motion.div
                key={product.id}
                layout
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-4">
                
                <div className="w-16 h-16 bg-lilac-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                  {product.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-800 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-sm font-bold text-lilac-600">
                        {formatCurrency(product.salePrice)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Costo: {formatCurrency(product.costPrice)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end">
                      {isEditing ?
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-lilac-200">
                          <button
                          onClick={() =>
                          setTempStock(Math.max(0, tempStock - 1))
                          }
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600">
                          
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-sm">
                            {tempStock}
                          </span>
                          <button
                          onClick={() => setTempStock(tempStock + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600">
                          
                            +
                          </button>
                          <button
                          onClick={() => handleSaveStock(product.id)}
                          className="w-6 h-6 flex items-center justify-center bg-lilac-500 rounded shadow-sm text-white ml-1">
                          
                            <Check size={14} />
                          </button>
                        </div> :

                      <div
                        onClick={() =>
                        handleEditStock(product.id, product.stock)
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        
                          <span className="text-sm font-bold">
                            {product.stock}
                          </span>
                          <span className="text-xs">unid.</span>
                          <Edit2 size={12} className="ml-1 opacity-50" />
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </motion.div>);

          })}
        </div>

        {filteredProducts.length === 0 &&
        <div className="text-center py-10 text-slate-400">
            <p>No se encontraron productos.</p>
          </div>
        }
      </div>
    </div>);

}