import { useState } from 'react'
import { useAppContext } from '../AppContext'
import { Plus, X, Trash2, Boxes } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Supply } from '../types'

const DEFAULT_EMOJIS = ['📋', '📄', '✂️', '📌', '🎀', '📍', '🔖', '📑', '📊', '📈']

interface FormState {
  name: string
  category: string
  unitCost: string
  emoji: string
}

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  unitCost: '',
  emoji: DEFAULT_EMOJIS[0],
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

export function Supplies() {
  const { supplies, addSupply, updateSupply, deleteSupply } = useAppContext()

  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  const [editSupplyId, setEditSupplyId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editing, setEditing] = useState(false)

  const [deleteSupplyId, setDeleteSupplyId] = useState<string | null>(null)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleting, setDeleting] = useState(false)

  const categories = Array.from(new Set(supplies.map((s) => s.category))).sort()

  const filteredSupplies = supplies.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todas' || s.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // ── ADD SUPPLY ──────────────────────────────────────────────────────────

  const handleAddSupply = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.unitCost) return
    setSaving(true)
    await addSupply({
      name: form.name.trim(),
      category: form.category.trim(),
      unitCost: Number(form.unitCost),
      emoji: form.emoji,
    })
    setForm(EMPTY_FORM)
    setShowAddModal(false)
    setSaving(false)
  }

  // ── EDIT SUPPLY ────────────────────────────────────────────────────────

  const handleStartEdit = (supply: Supply) => {
    setEditSupplyId(supply.id)
    setEditForm({
      name: supply.name,
      category: supply.category,
      unitCost: supply.unitCost.toString(),
      emoji: supply.emoji,
    })
  }

  const handleSaveEdit = async () => {
    if (!editSupplyId || !editForm.name.trim() || !editForm.category.trim() || !editForm.unitCost)
      return
    setEditing(true)
    try {
      await updateSupply(editSupplyId, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        unitCost: Number(editForm.unitCost),
        emoji: editForm.emoji,
      })
      setEditSupplyId(null)
      setEditForm(EMPTY_FORM)
    } catch (error) {
      console.error(error)
      alert('No se pudo actualizar el insumo. Intentá de nuevo.')
    } finally {
      setEditing(false)
    }
  }

  // ── DELETE SUPPLY ──────────────────────────────────────────────────────

  const handleStartDelete = (supplyId: string) => {
    setDeleteSupplyId(supplyId)
    setDeleteStep(1)
  }

  const handleConfirmDelete = async () => {
    if (!deleteSupplyId) return
    if (deleteStep === 1) {
      setDeleteStep(2)
      return
    }
    setDeleting(true)
    try {
      await deleteSupply(deleteSupplyId)
      setDeleteSupplyId(null)
      setDeleteStep(1)
    } catch (error) {
      alert('No se pudo eliminar el insumo.')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteSupplyId(null)
    setDeleteStep(1)
  }

  // ── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Insumos</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-lilac-100 text-lilac-600 p-2 rounded-xl hover:bg-lilac-200 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-1">Gestiona insumos para compras a proveedores</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 space-y-3">
        <input
          type="text"
          placeholder="Buscar insumo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
        />

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'Todas'
                  ? 'bg-lilac-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-lilac-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Supplies List */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSupplies.map((supply) => (
            <motion.div
              key={supply.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              {editSupplyId === supply.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Emoji
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {DEFAULT_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEditForm((f) => ({ ...f, emoji: e }))}
                          className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors ${
                            editForm.emoji === e
                              ? 'bg-lilac-100 ring-2 ring-lilac-400'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />

                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Categoría"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />

                  <input
                    type="number"
                    value={editForm.unitCost}
                    onChange={(e) => setEditForm((f) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="Costo unitario"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditSupplyId(null)
                        setEditForm(EMPTY_FORM)
                      }}
                      disabled={editing}
                      className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={editing || !editForm.name.trim() || !editForm.category.trim()}
                      className="flex-1 bg-lilac-500 text-white py-2 rounded-xl font-medium hover:bg-lilac-600 transition-colors disabled:opacity-50"
                    >
                      {editing ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{supply.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800">{supply.name}</h3>
                        <p className="text-xs text-slate-400">{supply.category}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(supply.unitCost)}</p>
                    <p className="text-xs text-slate-400">Costo unitario</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(supply)}
                      className="flex-1 bg-lilac-100 text-lilac-600 py-2 rounded-xl text-sm font-medium hover:bg-lilac-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleStartDelete(supply.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {filteredSupplies.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Boxes size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay insumos.</p>
            <p className="text-sm mt-1">Tocá + para crear tu primer insumo.</p>
          </div>
        )}
      </div>

      {/* ── Modal de nuevo insumo ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && !saving && setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 shadow-xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Nuevo Insumo</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {DEFAULT_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                        className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-colors ${
                          form.emoji === e
                            ? 'bg-lilac-100 ring-2 ring-lilac-400'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Hojas A4 blancas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoría *</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Ej: Papeles, Stickers, Tapas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Costo Unitario *
                  </label>
                  <input
                    type="number"
                    value={form.unitCost}
                    onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="Precio unitario"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSupply}
                  disabled={saving || !form.name.trim() || !form.category.trim() || !form.unitCost}
                  className="flex-1 bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Crear Insumo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de confirmación de eliminación ──────────────────────────── */}
      <AnimatePresence>
        {deleteSupplyId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Eliminar insumo</h3>
              <p className="text-sm text-slate-500 mb-6">
                {deleteStep === 1
                  ? '¿Estás seguro de que querés eliminar este insumo?'
                  : '⚠️ Esta acción no se puede deshacer.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-colors ${
                    deleteStep === 1
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
                  }`}
                >
                  {deleting ? 'Eliminando...' : deleteStep === 1 ? 'Eliminar' : 'Confirmar eliminación'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
