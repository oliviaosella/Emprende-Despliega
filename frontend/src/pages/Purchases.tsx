import { useState, useEffect } from 'react'
import { useAppContext } from '../AppContext'
import {
  Truck,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  Package,
  PenLine,
  ChevronDown,
  Boxes,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PurchaseItem } from '../types'
import { useViewMode } from '../components/ViewModeContext'
import { ViewToggle } from '../components/ViewToggle'

// ── Tipos locales del formulario ───────────────────────────────────────────

type ItemMode = 'inventory' | 'supplies' | 'manual'

interface CartItem {
  mode: ItemMode
  productId?: string
  supplyId?: string
  name: string
  qty: number
  unitCost: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

// ── Componente principal ───────────────────────────────────────────────────

interface PurchasesProps {
  preselectedProductId?: string | null
  onProductSelected?: () => void
}

export function Purchases({ preselectedProductId, onProductSelected }: PurchasesProps) {
  const { purchases, products, supplies, addPurchase } = useAppContext()
  const { viewMode } = useViewMode()

  const [showForm, setShowForm] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [itemMode, setItemMode] = useState<ItemMode>('inventory')

  // Estado para item de inventario
  const [selectedProductId, setSelectedProductId] = useState('')
  const [invQty, setInvQty] = useState(1)

  // Estado para item de insumo
  const [selectedSupplyId, setSelectedSupplyId] = useState('')
  const [supplyQty, setSupplyQty] = useState(1)
  const [supplyUnitCost, setSupplyUnitCost] = useState('')

  // Estado para item manual
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState(1)
  const [manualPrice, setManualPrice] = useState('')

  const [saving, setSaving] = useState(false)
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [expandedPurchaseItemKey, setExpandedPurchaseItemKey] = useState<string | null>(null)
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null)

  useEffect(() => {
    if (preselectedProductId && !showForm) {
      setSelectedProductId(preselectedProductId)
      setShowForm(true)
      setItemMode('inventory')
      onProductSelected?.()
    }
  }, [preselectedProductId, showForm, onProductSelected])

  const total = cartItems.reduce((sum, i) => sum + i.qty * i.unitCost, 0)

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  // ── Agregar item al carrito ──────────────────────────────────────────────

  const handleAddInventoryItem = () => {
    if (!selectedProduct) return
    setCartItems((prev) => {
      const existing = prev.findIndex((i) => i.productId === selectedProductId)
      if (existing >= 0) {
        return prev.map((i, idx) =>
          idx === existing ? { ...i, qty: i.qty + invQty } : i,
        )
      }
      return [
        ...prev,
        {
          mode: 'inventory',
          productId: selectedProduct.id,
          name: `${selectedProduct.emoji} ${selectedProduct.name}`,
          qty: invQty,
          unitCost: selectedProduct.costPrice,
        },
      ]
    })
    setSelectedProductId('')
    setInvQty(1)
  }

  const handleAddSupplyItem = () => {
    const supply = supplies.find((s) => s.id === selectedSupplyId)
    if (!supply || !supplyUnitCost) return
    const unitCost = Number(supplyUnitCost)
    setCartItems((prev) => {
      const existing = prev.findIndex((i) => i.supplyId === selectedSupplyId)
      if (existing >= 0) {
        return prev.map((i, idx) =>
          idx === existing ? { ...i, qty: i.qty + supplyQty, unitCost } : i,
        )
      }
      return [
        ...prev,
        {
          mode: 'supplies',
          supplyId: supply.id,
          name: `${supply.emoji} ${supply.name}`,
          qty: supplyQty,
          unitCost,
        },
      ]
    })
    setSelectedSupplyId('')
    setSupplyQty(1)
    setSupplyUnitCost('')
  }

  const handleAddManualItem = () => {
    if (!manualName.trim() || !manualPrice || manualQty < 1) return
    setCartItems((prev) => [
      ...prev,
      {
        mode: 'manual',
        name: manualName.trim(),
        qty: manualQty,
        unitCost: Number(manualPrice),
      },
    ])
    setManualName('')
    setManualQty(1)
    setManualPrice('')
  }

  const removeItem = (idx: number) =>
    setCartItems((prev) => prev.filter((_, i) => i !== idx))

  // ── Confirmar compra ─────────────────────────────────────────────────────

  const validate = () => {
    const errs: string[] = []
    if (!supplier.trim()) errs.push('Ingresá el nombre del proveedor.')
    if (cartItems.length === 0) errs.push('Agregá al menos un artículo.')
    return errs
  }

  const handleConfirm = async () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setSaving(true)

    const items: PurchaseItem[] = cartItems.map((i) => ({
      productId: i.productId,
      supplyId: i.supplyId,
      customName: i.mode === 'manual' ? i.name : undefined,
      qty: i.qty,
      unitCost: i.unitCost,
    }))

    await addPurchase(supplier.trim(), items)

    const ref = `C-${Date.now().toString().slice(-6)}`
    setSuccessRef(ref)
    setSaving(false)
  }

  const handleClose = () => {
    setShowForm(false)
    setSuccessRef(null)
    setSupplier('')
    setCartItems([])
    setErrors([])
    setItemMode('inventory')
    setSelectedProductId('')
    setInvQty(1)
    setSelectedSupplyId('')
    setSupplyQty(1)
    setSupplyUnitCost('')
    setManualName('')
    setManualQty(1)
    setManualPrice('')
  }

  // ── Nombre de producto para mostrar en historial ─────────────────────────

  const productName = (item: PurchaseItem) => {
    if (item.customName) return item.customName
    if (item.supplyId) {
      const s = supplies.find((sup) => sup.id === item.supplyId)
      return s ? `${s.emoji} ${s.name}` : 'Insumo'
    }
    const p = products.find((pr) => pr.id === item.productId)
    return p ? `${p.emoji} ${p.name}` : 'Producto'
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Compras</h1>
          <div className="flex items-center gap-2">
            <ViewToggle />
            <button
              onClick={() => setShowForm(true)}
              className="bg-lilac-100 text-lilac-600 p-2 rounded-xl hover:bg-lilac-200 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-1">Registro de insumos y mercadería</p>
      </div>

      {/* Lista de compras */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex flex-col gap-2'}>
          {purchases.map((purchase) => {
            const purchaseDate = new Date(purchase.date).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            const itemsList = (
              <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                {purchase.items.map((item, idx) => {
                  const itemKey = `${purchase.id}-${idx}`
                  const isExpanded = expandedPurchaseItemKey === itemKey
                  return (
                    <div key={itemKey}>
                      <button
                        onClick={() => setExpandedPurchaseItemKey(isExpanded ? null : itemKey)}
                        className="w-full flex justify-between items-center text-sm hover:bg-slate-100 p-2 -m-2 rounded transition"
                      >
                        <span className="text-slate-600">
                          {item.qty}× {productName(item)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">
                            {formatCurrency(item.unitCost * item.qty)}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-blue-50 p-2 rounded text-xs text-slate-500 space-y-1 mt-1">
                          <div className="flex justify-between">
                            <span>Costo unitario:</span>
                            <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cantidad:</span>
                            <span className="font-medium">{item.qty}</span>
                          </div>
                          <div className="border-t border-blue-100 pt-1 flex justify-between font-medium text-slate-700">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(item.unitCost * item.qty)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )

            if (viewMode === 'list') {
              const isExpanded = expandedPurchaseId === purchase.id
              return (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 shrink-0">
                      <Truck size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        {purchase.supplier}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {purchaseDate} · {purchase.items.length} artículo(s)
                      </p>
                    </div>
                    <p className="font-bold text-slate-800 text-sm shrink-0">
                      {formatCurrency(purchase.total)}
                    </p>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && <div className="px-3 pb-3">{itemsList}</div>}
                </motion.div>
              )
            }

            return (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{purchase.supplier}</h3>
                      <p className="text-xs text-slate-400">{purchaseDate}</p>
                    </div>
                  </div>
                  <p className="font-bold text-slate-800">{formatCurrency(purchase.total)}</p>
                </div>

                {itemsList}
              </motion.div>
            )
          })}
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay compras registradas.</p>
            <p className="text-sm mt-1">Tocá + para registrar tu primera compra.</p>
          </div>
        )}
      </div>

      {/* ── Modal de nueva compra ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && !saving && handleClose()}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl"
            >
              {/* ── Pantalla de éxito ── */}
              {successRef ? (
                <div className="flex flex-col items-center justify-center p-10 gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <CheckCircle2 size={64} className="text-green-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-slate-800">¡Compra registrada!</h2>
                  <p className="text-slate-500 text-sm">
                    La compra fue guardada y el gasto fue registrado en contabilidad.
                  </p>
                  <div className="bg-slate-50 rounded-2xl px-6 py-3 text-center">
                    <p className="text-xs text-slate-400">Referencia</p>
                    <p className="text-lg font-bold text-lilac-600">{successRef}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl px-4 py-2 text-sm text-green-700 font-medium">
                    Total: {formatCurrency(total)}
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-2 w-full bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  {/* Header modal */}
                  <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">Nueva Compra</h2>
                    <button
                      onClick={handleClose}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scroll content */}
                  <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    {/* Errores */}
                    {errors.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 space-y-1">
                        {errors.map((e, i) => (
                          <p key={i}>• {e}</p>
                        ))}
                      </div>
                    )}

                    {/* Proveedor */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Proveedor *
                      </label>
                      <input
                        type="text"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder="Nombre del proveedor"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                    </div>

                    {/* Toggle modo de item */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">
                        Agregar artículo
                      </label>
                      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3">
                        <button
                          onClick={() => setItemMode('inventory')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${itemMode === 'inventory' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          <Package size={14} />
                          <span className="hidden sm:inline">Inventario</span>
                          <span className="sm:hidden">Inv.</span>
                        </button>
                        <button
                          onClick={() => setItemMode('supplies')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${itemMode === 'supplies' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          <Boxes size={14} />
                          <span className="hidden sm:inline">Insumos</span>
                          <span className="sm:hidden">Ins.</span>
                        </button>
                        <button
                          onClick={() => setItemMode('manual')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${itemMode === 'manual' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          <PenLine size={14} />
                          <span className="hidden sm:inline">Manual</span>
                          <span className="sm:hidden">Man.</span>
                        </button>
                      </div>

                      {/* Formulario del inventario */}
                      {itemMode === 'inventory' && (
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              value={selectedProductId}
                              onChange={(e) => setSelectedProductId(e.target.value)}
                              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 pr-8"
                            >
                              <option value="">— Seleccioná un producto —</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.emoji} {p.name} — costo {formatCurrency(p.costPrice)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                          </div>

                          {selectedProduct && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-1">
                                <button
                                  onClick={() => setInvQty((q) => Math.max(1, q - 1))}
                                  className="text-slate-500 text-lg py-2"
                                >
                                  −
                                </button>
                                <span className="flex-1 text-center font-bold text-sm">{invQty}</span>
                                <button
                                  onClick={() => setInvQty((q) => q + 1)}
                                  className="text-slate-500 text-lg py-2"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-slate-500">
                                = {formatCurrency(invQty * selectedProduct.costPrice)}
                              </span>
                              <button
                                onClick={handleAddInventoryItem}
                                className="bg-lilac-500 text-white p-2.5 rounded-xl hover:bg-lilac-600 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Formulario de insumos */}
                      {itemMode === 'supplies' && (
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              value={selectedSupplyId}
                              onChange={(e) => {
                                const supply = supplies.find((s) => s.id === e.target.value)
                                setSelectedSupplyId(e.target.value)
                                setSupplyUnitCost(supply ? String(supply.unitCost) : '')
                              }}
                              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 pr-8"
                            >
                              <option value="">— Seleccioná un insumo —</option>
                              {supplies.filter((s) => s.active).map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.emoji} {s.name} — {formatCurrency(s.unitCost)} / {s.unit}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                          </div>

                          {supplies.find((s) => s.id === selectedSupplyId) && (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                  Costo unitario de esta compra
                                </label>
                                <input
                                  type="number"
                                  value={supplyUnitCost}
                                  onChange={(e) => setSupplyUnitCost(e.target.value)}
                                  placeholder="Costo unitario"
                                  min="0"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-1">
                                  <button
                                    onClick={() => setSupplyQty((q) => Math.max(1, q - 1))}
                                    className="text-slate-500 text-lg py-2"
                                  >
                                    −
                                  </button>
                                  <span className="flex-1 text-center font-bold text-sm">{supplyQty}</span>
                                  <button
                                    onClick={() => setSupplyQty((q) => q + 1)}
                                    className="text-slate-500 text-lg py-2"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-sm text-slate-500">
                                  = {formatCurrency(supplyQty * Number(supplyUnitCost || 0))}
                                </span>
                                <button
                                  onClick={handleAddSupplyItem}
                                  disabled={!supplyUnitCost}
                                  className="bg-lilac-500 text-white p-2.5 rounded-xl hover:bg-lilac-600 transition-colors disabled:opacity-40"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Formulario manual */}
                      {itemMode === 'manual' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder="Nombre del artículo"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                          />
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-1">
                              <button
                                onClick={() => setManualQty((q) => Math.max(1, q - 1))}
                                className="text-slate-500 text-lg py-2"
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-bold text-sm">{manualQty}</span>
                              <button
                                onClick={() => setManualQty((q) => q + 1)}
                                className="text-slate-500 text-lg py-2"
                              >
                                +
                              </button>
                            </div>
                            <input
                              type="number"
                              value={manualPrice}
                              onChange={(e) => setManualPrice(e.target.value)}
                              placeholder="Precio unit."
                              min="0"
                              className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 w-32"
                            />
                            <button
                              onClick={handleAddManualItem}
                              disabled={!manualName.trim() || !manualPrice}
                              className="bg-lilac-500 text-white p-2.5 rounded-xl hover:bg-lilac-600 transition-colors disabled:opacity-40"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lista de items agregados */}
                    {cartItems.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">
                          Artículos ({cartItems.length})
                        </p>
                        <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                          {cartItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {item.qty} × {formatCurrency(item.unitCost)}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-slate-800 shrink-0">
                                {formatCurrency(item.qty * item.unitCost)}
                              </p>
                              <button
                                onClick={() => removeItem(idx)}
                                className="text-red-400 hover:text-red-600 shrink-0"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center mt-3 px-1">
                          <p className="text-sm font-medium text-slate-500">Total</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(total)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones fijos */}
                  <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0">
                    <button
                      onClick={handleClose}
                      disabled={saving}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={saving || cartItems.length === 0 || !supplier.trim()}
                      className="flex-2 flex-1 bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Confirmar Compra'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
