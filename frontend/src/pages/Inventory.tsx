import { useState } from 'react'
import { useAppContext } from '../AppContext'
import { Search, Plus, Edit2, Check, X, History, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Category } from '../types'

const CATEGORIES: Category[] = ['Cuadernos', 'Arte', 'Papelería', 'Accesorios']
const DEFAULT_EMOJIS = ['📓', '🖼️', '✨', '🌸', '🔖', '🎨', '🖌️', '🛍️', '📦', '🎀', '🖊️', '📎']

interface ProductForm {
  name: string
  category: Category
  costPrice: string
  salePrice: string
  stock: string
  minStock: string
  emoji: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  category: 'Papelería',
  costPrice: '',
  salePrice: '',
  stock: '0',
  minStock: '5',
  emoji: '📦',
}

export function Inventory() {
  const { products, purchases, updateProductStock, addProduct } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [tempStock, setTempStock] = useState<number>(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [historyProductId, setHistoryProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount)

  const handleEditStock = (id: string, currentStock: number) => {
    setEditingStockId(id)
    setTempStock(currentStock)
  }

  const handleSaveStock = (id: string) => {
    updateProductStock(id, tempStock)
    setEditingStockId(null)
  }

  const handleAddProduct = async () => {
    if (!form.name.trim() || !form.costPrice || !form.salePrice) return
    setSaving(true)
    await addProduct({
      name: form.name.trim(),
      category: form.category,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      emoji: form.emoji,
    })
    setForm(EMPTY_FORM)
    setShowAddModal(false)
    setSaving(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Inventario</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-pink-100 text-pink-600 p-2 rounded-xl hover:bg-pink-200 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isLowStock = product.stock <= product.minStock
            const isEditing = editingStockId === product.id
            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-4"
              >
                <div className="w-16 h-16 bg-lilac-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                  {product.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                      <p className="text-xs text-slate-400">{product.category}</p>
                    </div>
                    <button
                      onClick={() => setHistoryProductId(product.id)}
                      className="text-slate-300 hover:text-lilac-400 transition-colors ml-1 shrink-0"
                      title="Ver historial de compras"
                    >
                      <History size={15} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-sm font-bold text-lilac-600">
                        {formatCurrency(product.salePrice)}
                      </p>
                      <p className="text-xs text-slate-400">Costo: {formatCurrency(product.costPrice)}</p>
                    </div>

                    <div className="flex flex-col items-end">
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-lilac-200">
                          <button
                            onClick={() => setTempStock(Math.max(0, tempStock - 1))}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{tempStock}</span>
                          <button
                            onClick={() => setTempStock(tempStock + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleSaveStock(product.id)}
                            className="w-6 h-6 flex items-center justify-center bg-lilac-500 rounded shadow-sm text-white ml-1"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleEditStock(product.id, product.stock)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                        >
                          <span className="text-sm font-bold">{product.stock}</span>
                          <span className="text-xs">unid.</span>
                          <Edit2 size={12} className="ml-1 opacity-50" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p>No se encontraron productos.</p>
          </div>
        )}
      </div>

      {/* Modal historial de compras por producto */}
      <AnimatePresence>
        {historyProductId && (() => {
          const prod = products.find((p) => p.id === historyProductId)
          const productPurchases = purchases
            .flatMap((pu) =>
              pu.items
                .filter((item) => item.productId === historyProductId)
                .map((item) => ({ ...item, supplier: pu.supplier, date: pu.date, purchaseId: pu.id })),
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          const formatCurrency = (n: number) =>
            new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setHistoryProductId(null)}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
              >
                <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      {prod?.emoji} {prod?.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Historial de compras al proveedor</p>
                  </div>
                  <button onClick={() => setHistoryProductId(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  {productPurchases.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Truck size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay compras registradas para este producto.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {productPurchases.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                              <Truck size={12} />
                              <span className="font-medium">{item.supplier}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {new Date(item.date).toLocaleDateString('es-AR', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800 text-sm">{item.qty} unid.</p>
                            <p className="text-xs text-slate-400">{formatCurrency(item.unitCost)} c/u</p>
                            <p className="text-xs font-medium text-lilac-600">{formatCurrency(item.qty * item.unitCost)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Modal agregar producto */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Nuevo Producto</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                        className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-colors ${form.emoji === e ? 'bg-lilac-100 ring-2 ring-lilac-400' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {e}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={form.emoji}
                      onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                      className="w-9 h-9 rounded-xl border border-slate-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      maxLength={2}
                      placeholder="+"
                    />
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Cuaderno A5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Precios */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Costo *</label>
                    <input
                      type="number"
                      value={form.costPrice}
                      onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Precio venta *</label>
                    <input
                      type="number"
                      value={form.salePrice}
                      onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Stock inicial</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Stock mínimo</label>
                    <input
                      type="number"
                      value={form.minStock}
                      onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddProduct}
                disabled={saving || !form.name.trim() || !form.costPrice || !form.salePrice}
                className="mt-6 w-full bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Agregar Producto'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
