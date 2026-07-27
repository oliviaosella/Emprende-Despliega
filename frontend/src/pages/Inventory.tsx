import { useEffect, useState } from 'react'
import { useAppContext } from '../AppContext'
import {
  Search,
  Plus,
  Edit2,
  Check,
  X,
  History,
  Truck,
  MoreVertical,
  Trash2,
  Pencil,
  Settings,
  ListTree,
  ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Category, ProductType } from '../types'
import { Supplies } from './Supplies'
import { useToast } from '../components/Toast'
import { useViewMode } from '../components/ViewModeContext'
import { ViewToggle } from '../components/ViewToggle'

type InventoryTab = 'productos' | 'insumos'

const DEFAULT_CATEGORIES: Category[] = ['Cuadernos', 'Arte', 'Papelería', 'Accesorios']
const DEFAULT_EMOJIS = ['📓', '🖼️', '✨', '🌸', '🔖', '🎨', '🖌️', '🛍️', '📦', '🎀', '🖊️', '📎']
const CATEGORY_STORAGE_KEY = 'miniEmprende.categories'
const MAX_CATEGORIES = 15

interface ProductForm {
  name: string
  category: Category
  productType: ProductType
  costPrice: string
  salePrice: string
  stock: string
  minStock: string
  emoji: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  category: '',
  productType: 'reventa',
  costPrice: '',
  salePrice: '',
  stock: '0',
  minStock: '5',
  emoji: '📦',
}

function ProductsPanel() {
  const {
    products,
    purchases,
    supplies,
    bomItems,
    updateProductStock,
    addProduct,
    updateProduct,
    deleteProduct,
    addBomItem,
    updateBomItem,
    deleteBomItem,
  } = useAppContext()
  const { showToast } = useToast()
  const { viewMode } = useViewMode()
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Category[]>(() => {
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
  })
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | Category>('Todas')
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [tempStock, setTempStock] = useState<number>(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [historyProductId, setHistoryProductId] = useState<string | null>(null)
  const [bomProductId, setBomProductId] = useState<string | null>(null)
  const [bomSupplyId, setBomSupplyId] = useState('')
  const [bomQuantity, setBomQuantity] = useState('1')
  const [bomSaving, setBomSaving] = useState(false)
  const [bomEditItemId, setBomEditItemId] = useState<string | null>(null)
  const [bomEditQuantity, setBomEditQuantity] = useState('')
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ProductForm>(EMPTY_FORM)
  const [editing, setEditing] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [deleting, setDeleting] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState('')
  const [categoryEditIndex, setCategoryEditIndex] = useState<number | null>(null)
  const [categoryEditDraft, setCategoryEditDraft] = useState('')
  const [categorySaving, setCategorySaving] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
    const costRequired = form.productType === 'reventa'
    if (!form.name.trim() || !form.category || !form.salePrice || (costRequired && !form.costPrice))
      return
    setSaving(true)
    await addProduct({
      name: form.name.trim(),
      category: form.category,
      productType: form.productType,
      costPrice: costRequired ? Number(form.costPrice) : 0,
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      emoji: form.emoji,
    })
    setForm(EMPTY_FORM)
    setShowAddModal(false)
    setSaving(false)
  }

  const persistCategories = (next: Category[]) => {
    setCategories(next)
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next))
  }

  const normalizeCategory = (value: string) => value.trim()

  const validateCategory = (value: string, ignoreIndex?: number | null) => {
    const normalized = normalizeCategory(value)
    if (!normalized) return 'Ingresá un nombre de categoría.'
    const exists = categories.some((cat, index) => {
      if (ignoreIndex !== undefined && ignoreIndex !== null && index === ignoreIndex) return false
      return cat.toLowerCase() === normalized.toLowerCase()
    })
    if (exists) return 'La categoría ya existe.'
    if (ignoreIndex === undefined && categories.length >= MAX_CATEGORIES) {
      return `Máximo ${MAX_CATEGORIES} categorías.`
    }
    return ''
  }

  const handleAddCategory = () => {
    const error = validateCategory(categoryDraft)
    if (error) {
      setCategoryError(error)
      return
    }
    const next = [...categories, normalizeCategory(categoryDraft)]
    persistCategories(next)
    setCategoryDraft('')
    setCategoryError('')
    showToast('Categoría creada correctamente.')
  }

  const handleStartEditCategory = (index: number) => {
    setCategoryEditIndex(index)
    setCategoryEditDraft(categories[index])
    setCategoryError('')
  }

  const handleSaveCategoryEdit = async () => {
    if (categoryEditIndex === null) return
    const error = validateCategory(categoryEditDraft, categoryEditIndex)
    if (error) {
      setCategoryError(error)
      return
    }
    const oldCategory = categories[categoryEditIndex]
    const updatedCategory = normalizeCategory(categoryEditDraft)
    const next = categories.map((cat, index) =>
      index === categoryEditIndex ? updatedCategory : cat,
    )
    setCategorySaving(true)
    try {
      const productsToUpdate = products.filter((p) => p.category === oldCategory)
      await Promise.all(
        productsToUpdate.map((product) =>
          updateProduct(product.id, {
            name: product.name,
            category: updatedCategory,
            productType: product.productType,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            stock: product.stock,
            minStock: product.minStock,
            emoji: product.emoji,
          }),
        ),
      )
      persistCategories(next)
      setCategoryEditIndex(null)
      setCategoryEditDraft('')
      setCategoryError('')
      showToast('Categoría actualizada correctamente.')
    } catch (error) {
      console.error(error)
      setCategoryError('No se pudo actualizar la categoría.')
      showToast('No se pudo actualizar la categoría.', 'error')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleDeleteCategory = (index: number) => {
    if (categories.length === 1) {
      setCategoryError('Debés mantener al menos una categoría.')
      return
    }
    const category = categories[index]
    const hasProducts = products.some((product) => product.category === category)
    if (hasProducts) {
      setCategoryError('No podés eliminar una categoría con productos asociados.')
      return
    }
    const next = categories.filter((_, idx) => idx !== index)
    persistCategories(next)
    if (selectedCategory === category) setSelectedCategory('Todas')
    setCategoryError('')
    showToast('Categoría eliminada correctamente.')
  }

  useEffect(() => {
    if (!categories.length) return
    if (!form.category) {
      setForm((prev) => ({ ...prev, category: categories[0] }))
    }
    if (editProductId && !editForm.category) {
      setEditForm((prev) => ({ ...prev, category: categories[0] }))
    }
  }, [categories, editForm.category, editProductId, form.category])

  const handleOpenEdit = (product: {
    id: string
    name: string
    category: Category
    productType: ProductType
    costPrice: number
    salePrice: number
    stock: number
    minStock: number
    emoji: string
  }) => {
    setEditProductId(product.id)
    setEditForm({
      name: product.name,
      category: product.category,
      productType: product.productType,
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      emoji: product.emoji,
    })
  }

  const handleUpdateProduct = async () => {
    const costRequired = editForm.productType === 'reventa'
    if (
      !editProductId ||
      !editForm.name.trim() ||
      !editForm.category ||
      !editForm.salePrice ||
      (costRequired && !editForm.costPrice)
    )
      return
    setEditing(true)
    try {
      await updateProduct(editProductId, {
        name: editForm.name.trim(),
        category: editForm.category,
        productType: editForm.productType,
        costPrice: costRequired ? Number(editForm.costPrice) : 0,
        salePrice: Number(editForm.salePrice),
        stock: Number(editForm.stock),
        minStock: Number(editForm.minStock),
        emoji: editForm.emoji,
      })
      setEditProductId(null)
      setEditForm(EMPTY_FORM)
    } catch (error) {
      console.error(error)
    } finally {
      setEditing(false)
    }
  }

  const handleStartDelete = (productId: string) => {
    setDeleteProductId(productId)
    setDeleteStep(1)
  }

  const handleConfirmDelete = async () => {
    if (!deleteProductId) return
    if (deleteStep === 1) {
      setDeleteStep(2)
      return
    }
    setDeleting(true)
    try {
      await deleteProduct(deleteProductId)
      setDeleteProductId(null)
      setDeleteStep(1)
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  // ── BOM (lista de materiales) ───────────────────────────────────────────

  const handleAddBomItem = async () => {
    if (!bomProductId || !bomSupplyId || !bomQuantity || Number(bomQuantity) <= 0) return
    setBomSaving(true)
    try {
      await addBomItem(bomProductId, bomSupplyId, Number(bomQuantity))
      setBomSupplyId('')
      setBomQuantity('1')
    } catch (error) {
      console.error(error)
    } finally {
      setBomSaving(false)
    }
  }

  const handleStartEditBomItem = (itemId: string, quantity: number) => {
    setBomEditItemId(itemId)
    setBomEditQuantity(String(quantity))
  }

  const handleSaveEditBomItem = async () => {
    if (!bomEditItemId || !bomEditQuantity || Number(bomEditQuantity) <= 0) return
    setBomSaving(true)
    try {
      await updateBomItem(bomEditItemId, Number(bomEditQuantity))
      setBomEditItemId(null)
      setBomEditQuantity('')
    } catch (error) {
      console.error(error)
    } finally {
      setBomSaving(false)
    }
  }

  const handleDeleteBomItem = async (itemId: string) => {
    setBomSaving(true)
    try {
      await deleteBomItem(itemId)
    } catch (error) {
      console.error(error)
    } finally {
      setBomSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ViewToggle />
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-200 transition-colors shrink-0"
              title="Configurar categorías"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-pink-100 text-pink-600 p-2.5 rounded-xl hover:bg-pink-200 transition-colors shrink-0"
              title="Agregar producto"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as 'Todas' | Category)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
        >
          <option value="Todas">Todas las categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-6">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
          {filteredProducts.map((product) => {
            const criticalThreshold = Math.max(0, Math.floor(product.minStock / 2))
            const isCriticalStock = product.stock <= criticalThreshold
            const isLowStock = !isCriticalStock && product.stock <= product.minStock
            const isEditing = editingStockId === product.id
            const stockBadge = isCriticalStock
              ? 'bg-red-100 text-red-600'
              : isLowStock
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            const stockLabel = isCriticalStock ? 'Critico' : isLowStock ? 'Bajo' : 'Normal'

            const typeBadge = (
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${
                  product.productType === 'fabricado'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {product.productType === 'fabricado' ? 'Fabricado' : 'Reventa'}
              </span>
            )

            const optionsMenu = (
              <div className="relative shrink-0">
                <button
                  onClick={() =>
                    setOpenMenuId((current) => (current === product.id ? null : product.id))
                  }
                  className="text-slate-300 hover:text-lilac-400 transition-colors ml-1"
                  title="Opciones"
                >
                  <MoreVertical size={16} />
                </button>
                {openMenuId === product.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenMenuId(null)
                        handleOpenEdit(product)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                      Modificar
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null)
                        setHistoryProductId(product.id)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <History size={14} />
                      Historial
                    </button>
                    {product.productType === 'fabricado' && (
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          setBomProductId(product.id)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <ListTree size={14} />
                        Lista de materiales
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setOpenMenuId(null)
                        handleStartDelete(product.id)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )

            if (viewMode === 'list') {
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl px-3 py-2.5 border border-slate-100 shadow-sm flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-lilac-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {product.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-slate-800 truncate text-sm">{product.name}</h3>
                      <span className="hidden sm:inline-flex shrink-0">{typeBadge}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{product.category}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-lilac-600">
                      {formatCurrency(product.salePrice)}
                    </p>
                    <p className="text-xs text-slate-400 hidden sm:block">
                      Costo: {formatCurrency(product.costPrice)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1 border border-lilac-200">
                        <button
                          onClick={() => setTempStock(Math.max(0, tempStock - 1))}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-sm">{tempStock}</span>
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
                          <Check size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleEditStock(product.id, product.stock)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer ${isCriticalStock ? 'bg-red-50 text-red-600' : isLowStock ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-600'}`}
                      >
                        <span className="text-sm font-bold">{product.stock}</span>
                        <span
                          className={`hidden sm:inline text-[9px] font-semibold px-1 py-0.5 rounded-full ${stockBadge}`}
                        >
                          {stockLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {optionsMenu}
                </motion.div>
              )
            }

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
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-slate-400">{product.category}</p>
                        {typeBadge}
                      </div>
                    </div>
                    {optionsMenu}
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
                          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer ${isCriticalStock ? 'bg-red-50 text-red-600' : isLowStock ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-600'}`}
                        >
                          <span className="text-sm font-bold">{product.stock}</span>
                          <span className="text-xs">unid.</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stockBadge}`}>
                            {stockLabel}
                          </span>
                          <Edit2 size={12} className="opacity-50" />
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
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de producto */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">
                    Tipo de producto
                  </label>
                  <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, productType: 'reventa' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.productType === 'reventa'
                          ? 'bg-white text-lilac-600 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      Reventa
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, productType: 'fabricado' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.productType === 'fabricado'
                          ? 'bg-white text-lilac-600 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      Fabricado
                    </button>
                  </div>
                </div>

                {/* Precios */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Costo {form.productType === 'reventa' ? '*' : ''}
                    </label>
                    {form.productType === 'fabricado' ? (
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-400">
                        Se calcula con la BOM
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={form.costPrice}
                        onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                    )}
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
                disabled={
                  saving ||
                  !form.name.trim() ||
                  !form.category ||
                  !form.salePrice ||
                  (form.productType === 'reventa' && !form.costPrice)
                }
                className="mt-6 w-full bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Agregar Producto'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal configurar categorias */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Categorías</h2>
                  <p className="text-xs text-slate-400">Máximo {MAX_CATEGORIES} categorías</p>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryDraft}
                    onChange={(e) => setCategoryDraft(e.target.value)}
                    placeholder="Nueva categoría"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={categories.length >= MAX_CATEGORIES}
                    className="bg-lilac-500 text-white px-4 rounded-xl font-semibold disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>

                {categoryError && (
                  <p className="text-xs text-red-500">{categoryError}</p>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map((cat, index) => (
                    <div key={`${cat}-${index}`} className="flex items-center gap-2">
                      {categoryEditIndex === index ? (
                        <input
                          type="text"
                          value={categoryEditDraft}
                          onChange={(e) => setCategoryEditDraft(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                        />
                      ) : (
                        <div className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-700">
                          {cat}
                        </div>
                      )}

                      {categoryEditIndex === index ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveCategoryEdit}
                            disabled={categorySaving}
                            className="px-3 py-2 bg-lilac-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setCategoryEditIndex(null)
                              setCategoryEditDraft('')
                              setCategoryError('')
                            }}
                            className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEditCategory(index)}
                            className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(index)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-semibold"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal editar producto */}
      <AnimatePresence>
        {editProductId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setEditProductId(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Editar Producto</h2>
                <button
                  onClick={() => setEditProductId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEditForm((f) => ({ ...f, emoji: e }))}
                        className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-colors ${editForm.emoji === e ? 'bg-lilac-100 ring-2 ring-lilac-400' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {e}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={editForm.emoji}
                      onChange={(e) => setEditForm((f) => ({ ...f, emoji: e.target.value }))}
                      className="w-9 h-9 rounded-xl border border-slate-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      maxLength={2}
                      placeholder="+"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoría</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">
                    Tipo de producto
                  </label>
                  <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, productType: 'reventa' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editForm.productType === 'reventa'
                          ? 'bg-white text-lilac-600 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      Reventa
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, productType: 'fabricado' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editForm.productType === 'fabricado'
                          ? 'bg-white text-lilac-600 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      Fabricado
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Costo {editForm.productType === 'reventa' ? '*' : ''}
                    </label>
                    {editForm.productType === 'fabricado' ? (
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-400">
                        Se calcula con la BOM
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={editForm.costPrice}
                        onChange={(e) => setEditForm((f) => ({ ...f, costPrice: e.target.value }))}
                        min="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Precio venta *</label>
                    <input
                      type="number"
                      value={editForm.salePrice}
                      onChange={(e) => setEditForm((f) => ({ ...f, salePrice: e.target.value }))}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Stock</label>
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Stock mínimo</label>
                    <input
                      type="number"
                      value={editForm.minStock}
                      onChange={(e) => setEditForm((f) => ({ ...f, minStock: e.target.value }))}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateProduct}
                disabled={
                  editing ||
                  !editForm.name.trim() ||
                  !editForm.category ||
                  !editForm.salePrice ||
                  (editForm.productType === 'reventa' && !editForm.costPrice)
                }
                className="mt-6 w-full bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editing ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal eliminar producto */}
      <AnimatePresence>
        {deleteProductId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteProductId(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-slate-800">Eliminar producto</h2>
              <p className="text-sm text-slate-500 mt-2">
                {deleteStep === 1
                  ? 'Esta accion eliminara el producto de forma permanente.'
                  : 'Seguro que desea eliminar el producto? Esta accion es permanente.'}
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setDeleteProductId(null)
                    setDeleteStep(1)
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteStep === 1 ? 'Continuar' : deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal lista de materiales (BOM) */}
      <AnimatePresence>
        {bomProductId && (() => {
          const bomProduct = products.find((p) => p.id === bomProductId)
          const items = bomItems.filter((b) => b.productId === bomProductId)
          const activeSupplies = supplies.filter((s) => s.active)
          const total = items.reduce((sum, item) => {
            const supply = supplies.find((s) => s.id === item.supplyId)
            return sum + item.quantity * (supply?.unitCost ?? 0)
          }, 0)

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setBomProductId(null)}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
              >
                <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      {bomProduct?.emoji} {bomProduct?.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Lista de materiales (BOM)</p>
                  </div>
                  <button
                    onClick={() => setBomProductId(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                  {/* Agregar insumo */}
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={bomSupplyId}
                        onChange={(e) => setBomSupplyId(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 pr-8"
                      >
                        <option value="">— Seleccioná un insumo —</option>
                        {activeSupplies
                          .filter((s) => !items.some((i) => i.supplyId === s.id))
                          .map((s) => (
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
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={bomQuantity}
                        onChange={(e) => setBomQuantity(e.target.value)}
                        placeholder="Cantidad"
                        min="0"
                        step="any"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                      <button
                        onClick={handleAddBomItem}
                        disabled={bomSaving || !bomSupplyId || !bomQuantity}
                        className="bg-lilac-500 text-white px-4 rounded-xl font-medium hover:bg-lilac-600 transition-colors disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Ítems de la BOM */}
                  <div className="space-y-2">
                    {items.map((item) => {
                      const supply = supplies.find((s) => s.id === item.supplyId)
                      const subtotal = item.quantity * (supply?.unitCost ?? 0)
                      const isEditingItem = bomEditItemId === item.id
                      return (
                        <div key={item.id} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {supply?.emoji} {supply?.name ?? 'Insumo'}
                              </p>
                              {!isEditingItem && (
                                <p className="text-xs text-slate-400">
                                  {item.quantity} {supply?.unit} × {formatCurrency(supply?.unitCost ?? 0)}
                                </p>
                              )}
                            </div>
                            {isEditingItem ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="number"
                                  value={bomEditQuantity}
                                  onChange={(e) => setBomEditQuantity(e.target.value)}
                                  min="0"
                                  step="any"
                                  className="w-20 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                                />
                                <button
                                  onClick={handleSaveEditBomItem}
                                  disabled={bomSaving}
                                  className="text-lilac-600 text-xs font-semibold disabled:opacity-50"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setBomEditItemId(null)}
                                  className="text-slate-400 text-xs font-medium"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-bold text-slate-800">
                                  {formatCurrency(subtotal)}
                                </span>
                                <button
                                  onClick={() => handleStartEditBomItem(item.id, item.quantity)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteBomItem(item.id)}
                                  disabled={bomSaving}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {items.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">
                        Todavía no hay insumos en la lista de materiales.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 shrink-0 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Costo total</span>
                  <span className="text-lg font-bold text-slate-800">{formatCurrency(total)}</span>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

export function Inventory() {
  const [tab, setTab] = useState<InventoryTab>('productos')

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-4">Stock</h1>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setTab('productos')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'productos' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setTab('insumos')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'insumos' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Insumos
          </button>
        </div>
      </div>

      {tab === 'productos' ? <ProductsPanel /> : <Supplies />}
    </div>
  )
}
