import { useState } from 'react'
import { useAppContext } from '../AppContext'
import { Plus, X, Trash2, Pencil, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PurchaseSupplier } from '../types'
import { useViewMode } from '../components/ViewModeContext'
import { ViewToggle } from '../components/ViewToggle'

interface FormState {
  name: string
  phone: string
  email: string
}

const EMPTY_FORM: FormState = { name: '', phone: '', email: '' }

export function PurchaseSuppliers() {
  const {
    purchaseSuppliers,
    addPurchaseSupplier,
    updatePurchaseSupplier,
    deletePurchaseSupplier,
  } = useAppContext()
  const { viewMode } = useViewMode()

  const [searchTerm, setSearchTerm] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [editSupplierId, setEditSupplierId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editing, setEditing] = useState(false)

  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleting, setDeleting] = useState(false)

  const filteredSuppliers = purchaseSuppliers.filter((s) => {
    const term = searchTerm.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.phone ?? '').toLowerCase().includes(term) ||
      (s.email ?? '').toLowerCase().includes(term)
    )
  })

  // ── ADD ──────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await addPurchaseSupplier({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
    })
    setForm(EMPTY_FORM)
    setShowAddModal(false)
    setSaving(false)
  }

  // ── EDIT ─────────────────────────────────────────────────────────────────

  const handleStartEdit = (supplier: PurchaseSupplier) => {
    setEditSupplierId(supplier.id)
    setEditForm({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editSupplierId || !editForm.name.trim()) return
    setEditing(true)
    try {
      await updatePurchaseSupplier(editSupplierId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
      })
      setEditSupplierId(null)
      setEditForm(EMPTY_FORM)
    } catch (error) {
      console.error(error)
    } finally {
      setEditing(false)
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────

  const handleStartDelete = (supplierId: string) => {
    setDeleteSupplierId(supplierId)
    setDeleteStep(1)
  }

  const handleConfirmDelete = async () => {
    if (!deleteSupplierId) return
    if (deleteStep === 1) {
      setDeleteStep(2)
      return
    }
    setDeleting(true)
    try {
      await deletePurchaseSupplier(deleteSupplierId)
      setDeleteSupplierId(null)
      setDeleteStep(1)
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteSupplierId(null)
    setDeleteStep(1)
  }

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[140px] bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
          />
          <div className="flex items-center gap-2 shrink-0">
            <ViewToggle />
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-lilac-100 text-lilac-600 p-2.5 rounded-xl hover:bg-lilac-200 transition-colors shrink-0"
              title="Nuevo proveedor"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de proveedores */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
          {filteredSuppliers.map((supplier) => {
            const isEditingItem = editSupplierId === supplier.id

            if (isEditingItem) {
              return (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Nombre y apellido
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Gmail</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditSupplierId(null)
                        setEditForm(EMPTY_FORM)
                      }}
                      disabled={editing}
                      className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={editing || !editForm.name.trim()}
                      className="flex-1 bg-lilac-500 text-white py-2 rounded-xl font-medium hover:bg-lilac-600 transition-colors disabled:opacity-50"
                    >
                      {editing ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </motion.div>
              )
            }

            if (viewMode === 'list') {
              return (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl px-3 py-2.5 border border-slate-100 shadow-sm flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-lilac-50 rounded-lg flex items-center justify-center text-lilac-500 shrink-0">
                    <Truck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate text-sm">{supplier.name}</h3>
                    {(supplier.phone || supplier.email) && (
                      <p className="text-xs text-slate-400 truncate">
                        {[supplier.phone, supplier.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(supplier)}
                      className="p-2 bg-lilac-100 text-lilac-600 rounded-lg hover:bg-lilac-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleStartDelete(supplier.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-lilac-50 rounded-xl flex items-center justify-center text-lilac-500 shrink-0">
                    <Truck size={18} />
                  </div>
                  <h3 className="font-semibold text-slate-800 truncate">{supplier.name}</h3>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-3 min-h-[52px] flex flex-col justify-center">
                  {supplier.phone && <p className="text-sm text-slate-600">{supplier.phone}</p>}
                  {supplier.email && <p className="text-sm text-slate-600">{supplier.email}</p>}
                  {!supplier.phone && !supplier.email && (
                    <p className="text-xs text-slate-400">Sin teléfono ni gmail cargados</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(supplier)}
                    className="px-3 py-2 bg-lilac-100 text-lilac-600 rounded-xl hover:bg-lilac-200 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleStartDelete(supplier.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay proveedores.</p>
            <p className="text-sm mt-1">Tocá + para crear tu primer proveedor.</p>
          </div>
        )}
      </div>

      {/* ── Modal de nuevo proveedor ─────────────────────────────────────────── */}
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
                <h2 className="text-lg font-bold text-slate-800">Nuevo Proveedor</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Nombre y apellido *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Se puede completar después"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Gmail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Se puede completar después"
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
                  onClick={handleAdd}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-lilac-500 text-white py-3 rounded-2xl font-semibold hover:bg-lilac-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Crear Proveedor'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de confirmación de eliminación ──────────────────────────── */}
      <AnimatePresence>
        {deleteSupplierId && (
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
              <h3 className="text-lg font-bold text-slate-800 mb-2">Eliminar proveedor</h3>
              <p className="text-sm text-slate-500 mb-6">
                {deleteStep === 1
                  ? '¿Estás seguro de que querés eliminar este proveedor?'
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
