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
import type { PurchaseItem, UnitOfMeasure, Category } from '../types'
import { UNITS_OF_MEASURE } from '../types'
import { useViewMode } from '../components/ViewModeContext'
import { ViewToggle } from '../components/ViewToggle'
import { SearchableSelect } from '../components/SearchableSelect'
import { PurchaseSuppliers } from './PurchaseSuppliers'

// ── Tipos locales del formulario ───────────────────────────────────────────

type ItemMode = 'inventory' | 'supplies' | 'manual'
type ManualMode = 'product' | 'supply'
type ComprasTab = 'compras' | 'proveedores'

interface CartItem {
  mode: ItemMode
  productId?: string
  supplyId?: string
  name: string
  qty: number
  unitCost: number
}

// ── Categorías (misma fuente que Inventario) ────────────────────────────────

const CATEGORY_STORAGE_KEY = 'miniEmprende.categories'
const DEFAULT_CATEGORIES: Category[] = ['Cuadernos', 'Arte', 'Papelería', 'Accesorios']

const readCategories = (): Category[] => {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES
  const stored = window.localStorage.getItem(CATEGORY_STORAGE_KEY)
  if (!stored) return DEFAULT_CATEGORIES
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed as Category[]
    }
  } catch {
    return DEFAULT_CATEGORIES
  }
  return DEFAULT_CATEGORIES
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

function ComprasPanel({ preselectedProductId, onProductSelected }: PurchasesProps) {
  const {
    purchases,
    products,
    supplies,
    supplyTypes,
    purchaseSuppliers,
    addPurchase,
    addProduct,
    addSupply,
    addPurchaseSupplier,
  } = useAppContext()
  const { viewMode } = useViewMode()

  const [categories] = useState<Category[]>(readCategories)

  const [showForm, setShowForm] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [itemMode, setItemMode] = useState<ItemMode>('inventory')

  // Estado para item de inventario
  const [selectedProductId, setSelectedProductId] = useState('')
  const [invQty, setInvQty] = useState(1)

  // Estado para item de insumo
  const [selectedSupplyId, setSelectedSupplyId] = useState('')
  const [supplyQty, setSupplyQty] = useState(1)
  const [supplyUnitCost, setSupplyUnitCost] = useState('')

  // Estado para item manual (alta de producto o insumo nuevo)
  const [manualMode, setManualMode] = useState<ManualMode>('product')
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState(1)
  const [manualPrice, setManualPrice] = useState('')
  const [manualCategory, setManualCategory] = useState('')
  const [manualSalePrice, setManualSalePrice] = useState('')
  const [manualSupplyTypeId, setManualSupplyTypeId] = useState('')
  const [manualUnit, setManualUnit] = useState<UnitOfMeasure>(UNITS_OF_MEASURE[0])
  const [manualSaving, setManualSaving] = useState(false)

  // Estado del proveedor (alta rápida dentro de Nueva Compra)
  const [showQuickAddSupplier, setShowQuickAddSupplier] = useState(false)
  const [quickSupplierName, setQuickSupplierName] = useState('')
  const [quickSupplierSaving, setQuickSupplierSaving] = useState(false)

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

  const resetManualForm = () => {
    setManualName('')
    setManualQty(1)
    setManualPrice('')
    setManualCategory('')
    setManualSalePrice('')
    setManualSupplyTypeId('')
    setManualUnit(UNITS_OF_MEASURE[0])
  }

  const handleAddManualItem = async () => {
    if (!manualName.trim() || !manualPrice || manualQty < 1) return
    setManualSaving(true)
    try {
      if (manualMode === 'product') {
        if (!manualCategory || !manualSalePrice) return
        const newProduct = await addProduct({
          name: manualName.trim(),
          category: manualCategory,
          productType: 'reventa',
          costPrice: Number(manualPrice),
          salePrice: Number(manualSalePrice),
          stock: 0,
          minStock: 5,
          emoji: '📦',
        })
        if (!newProduct) return
        setCartItems((prev) => [
          ...prev,
          {
            mode: 'inventory',
            productId: newProduct.id,
            name: `${newProduct.emoji} ${newProduct.name}`,
            qty: manualQty,
            unitCost: Number(manualPrice),
          },
        ])
      } else {
        if (!manualSupplyTypeId) return
        const newSupply = await addSupply({
          name: manualName.trim(),
          supplyTypeId: manualSupplyTypeId,
          unit: manualUnit,
          unitCost: Number(manualPrice),
          active: true,
          emoji: '📋',
        })
        if (!newSupply) return
        setCartItems((prev) => [
          ...prev,
          {
            mode: 'supplies',
            supplyId: newSupply.id,
            name: `${newSupply.emoji} ${newSupply.name}`,
            qty: manualQty,
            unitCost: Number(manualPrice),
          },
        ])
      }
      resetManualForm()
    } finally {
      setManualSaving(false)
    }
  }

  const removeItem = (idx: number) =>
    setCartItems((prev) => prev.filter((_, i) => i !== idx))

  // ── Proveedor: alta rápida dentro de Nueva Compra ─────────────────────────

  const handleQuickAddSupplier = async () => {
    if (!quickSupplierName.trim()) return
    setQuickSupplierSaving(true)
    try {
      const created = await addPurchaseSupplier({ name: quickSupplierName.trim() })
      if (created) {
        setSelectedSupplierId(created.id)
        setQuickSupplierName('')
        setShowQuickAddSupplier(false)
      }
    } finally {
      setQuickSupplierSaving(false)
    }
  }

  // ── Confirmar compra ─────────────────────────────────────────────────────

  const selectedSupplier = purchaseSuppliers.find((s) => s.id === selectedSupplierId)

  const validate = () => {
    const errs: string[] = []
    if (!selectedSupplierId) errs.push('Elegí o creá un proveedor.')
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
      qty: i.qty,
      unitCost: i.unitCost,
    }))

    await addPurchase(selectedSupplier?.name ?? '', items)

    const ref = `C-${Date.now().toString().slice(-6)}`
    setSuccessRef(ref)
    setSaving(false)
  }

  const handleClose = () => {
    setShowForm(false)
    setSuccessRef(null)
    setSelectedSupplierId('')
    setShowQuickAddSupplier(false)
    setQuickSupplierName('')
    setCartItems([])
    setErrors([])
    setItemMode('inventory')
    setSelectedProductId('')
    setInvQty(1)
    setSelectedSupplyId('')
    setSupplyQty(1)
    setSupplyUnitCost('')
    setManualMode('product')
    resetManualForm()
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-slate-500 text-sm">Registro de insumos y mercadería</p>
          <div className="flex items-center gap-2 shrink-0">
            <ViewToggle />
            <button
              onClick={() => setShowForm(true)}
              className="bg-lilac-100 text-lilac-600 p-2 rounded-xl hover:bg-lilac-200 transition-colors"
              title="Nueva compra"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
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
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 pr-8"
                          >
                            <option value="">— Seleccioná un proveedor —</option>
                            {purchaseSuppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                        <button
                          onClick={() => setShowQuickAddSupplier((v) => !v)}
                          className="bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-200 transition-colors shrink-0"
                          title="Nuevo proveedor"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {showQuickAddSupplier && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={quickSupplierName}
                            onChange={(e) => setQuickSupplierName(e.target.value)}
                            placeholder="Nombre del proveedor"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                          />
                          <button
                            onClick={handleQuickAddSupplier}
                            disabled={quickSupplierSaving || !quickSupplierName.trim()}
                            className="bg-lilac-500 text-white px-4 rounded-xl font-medium hover:bg-lilac-600 transition-colors disabled:opacity-50"
                          >
                            {quickSupplierSaving ? '...' : 'Agregar'}
                          </button>
                        </div>
                      )}
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
                          <SearchableSelect
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                            placeholder="Buscar producto..."
                            emptyMessage="No se encontraron productos."
                            options={products.map((p) => ({
                              value: p.id,
                              label: `${p.emoji} ${p.name} — costo ${formatCurrency(p.costPrice)}`,
                              searchText: p.name,
                            }))}
                          />

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

                      {/* Formulario manual: crea un producto o un insumo nuevo */}
                      {itemMode === 'manual' && (
                        <div className="space-y-2">
                          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                            <button
                              onClick={() => setManualMode('product')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${manualMode === 'product' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'}`}
                            >
                              <Package size={14} />
                              Producto nuevo
                            </button>
                            <button
                              onClick={() => setManualMode('supply')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${manualMode === 'supply' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'}`}
                            >
                              <Boxes size={14} />
                              Insumo nuevo
                            </button>
                          </div>

                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder={manualMode === 'product' ? 'Nombre del producto' : 'Nombre del insumo'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                          />

                          {manualMode === 'product' ? (
                            <div className="flex gap-2">
                              <select
                                value={manualCategory}
                                onChange={(e) => setManualCategory(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                              >
                                <option value="">— Categoría —</option>
                                {categories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={manualSalePrice}
                                onChange={(e) => setManualSalePrice(e.target.value)}
                                placeholder="Precio venta"
                                min="0"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                              />
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <select
                                value={manualSupplyTypeId}
                                onChange={(e) => setManualSupplyTypeId(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                              >
                                <option value="">— Tipo de insumo —</option>
                                {supplyTypes.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={manualUnit}
                                onChange={(e) => setManualUnit(e.target.value as UnitOfMeasure)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                              >
                                {UNITS_OF_MEASURE.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

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
                              placeholder="Costo compra"
                              min="0"
                              className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 w-32"
                            />
                            <button
                              onClick={handleAddManualItem}
                              disabled={
                                manualSaving ||
                                !manualName.trim() ||
                                !manualPrice ||
                                (manualMode === 'product' ? !manualCategory || !manualSalePrice : !manualSupplyTypeId)
                              }
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
                      disabled={saving || cartItems.length === 0 || !selectedSupplierId}
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

export function Purchases({ preselectedProductId, onProductSelected }: PurchasesProps) {
  const [tab, setTab] = useState<ComprasTab>('compras')

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-4">Compras</h1>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setTab('compras')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'compras' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Historial
          </button>
          <button
            onClick={() => setTab('proveedores')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'proveedores' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Proveedores
          </button>
        </div>
      </div>

      {tab === 'compras' ? (
        <ComprasPanel
          preselectedProductId={preselectedProductId}
          onProductSelected={onProductSelected}
        />
      ) : (
        <PurchaseSuppliers />
      )}
    </div>
  )
}
