import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Search, Plus, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../types';

const CATEGORIES: Category[] = ['Cuadernos', 'Arte', 'Papelería', 'Accesorios'];

const emptyForm = {
  name: '',
  category: 'Cuadernos' as Category,
  salePrice: 0,
  costPrice: 0,
  stock: 0,
  minStock: 5,
  emoji: '📦',
};

export function Inventory() {
  const { products, updateProductStock, addProduct } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);

  const handleEditStock = (id: string, currentStock: number) => {
    setEditingStockId(id);
    setTempStock(currentStock);
  };

  const handleSaveStock = (id: string) => {
    updateProductStock(id, tempStock);
    setEditingStockId(null);
  };

  const handleAddProduct = () => {
    if (!form.name.trim()) return;
    addProduct({
      name: form.name.trim(),
      category: form.category,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      emoji: form.emoji || '📦',
    });
    setForm(emptyForm);
    setShowAddModal(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Inventario
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-pink-100 text-pink-600 p-2 rounded-xl hover:bg-pink-200 transition-colors">
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-4">

                <div className="w-16 h-16 bg-lilac-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                  {product.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                      <p className="text-xs text-slate-400">{product.category}</p>
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
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-lilac-200">
                          <button
                            onClick={() => setTempStock(Math.max(0, tempStock - 1))}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600">
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{tempStock}</span>
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
                        </div>
                      ) : (
                        <div
                          onClick={() => handleEditStock(product.id, product.stock)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          <span className="text-sm font-bold">{product.stock}</span>
                          <span className="text-xs">unid.</span>
                          <Edit2 size={12} className="ml-1 opacity-50" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p>{searchTerm ? 'No se encontraron productos.' : 'Aún no hay productos. Tocá + para agregar uno.'}</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setShowAddModal(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full lg:w-[480px] bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto">

              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-slate-800">Nuevo Producto</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {/* Emoji + Name */}
                <div className="flex gap-3">
                  <div className="w-20">
                    <label className="text-xs text-slate-500 mb-1 block">Emoji</label>
                    <input
                      type="text"
                      value={form.emoji}
                      onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xl text-center focus:outline-none focus:ring-2 focus:ring-lilac-300" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej: Cuaderno A5"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300" />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Categoría</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setForm({ ...form, category: cat })}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${form.category === cat ? 'bg-lilac-50 border-lilac-300 text-lilac-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Precio de venta *</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.salePrice || ''}
                      onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Precio de costo</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.costPrice || ''}
                      onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300" />
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Stock inicial</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.stock || ''}
                      onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Stock mínimo</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="5"
                      value={form.minStock || ''}
                      onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300" />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 shrink-0 pb-8">
                <button
                  onClick={handleAddProduct}
                  disabled={!form.name.trim()}
                  className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-pink-200 transition-colors flex items-center justify-center gap-2">
                  <Plus size={20} />
                  Agregar Producto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
