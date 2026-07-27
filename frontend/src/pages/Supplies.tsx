import { useState } from 'react'
import { useAppContext } from '../AppContext'
import { Plus, X, Trash2, Boxes, Settings, ChevronDown, History, TrendingUp, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Supply, UnitOfMeasure } from '../types'
import { UNITS_OF_MEASURE } from '../types'
import { useViewMode } from '../components/ViewModeContext'
import { ViewToggle } from '../components/ViewToggle'
import { InfoTooltip } from '../components/InfoTooltip'

const DEFAULT_EMOJIS = ['📋', '📄', '✂️', '📌', '🎀', '📍', '🔖', '📑', '📊', '📈']

const ACTIVE_TOOLTIP =
  'Los insumos inactivos no aparecen para elegir en compras ni en listas de materiales, pero conservan su historial.'

interface FormState {
  name: string
  supplyTypeId: string
  unit: UnitOfMeasure
  unitCost: string
  packPrice: string
  packQuantity: string
  active: boolean
  emoji: string
}

const EMPTY_FORM: FormState = {
  name: '',
  supplyTypeId: '',
  unit: UNITS_OF_MEASURE[0],
  unitCost: '',
  packPrice: '',
  packQuantity: '',
  active: true,
  emoji: DEFAULT_EMOJIS[0],
}

const resolveUnitCost = (form: FormState) =>
  form.unit === 'Hoja' && form.packPrice && form.packQuantity
    ? Number(form.packPrice) / Number(form.packQuantity)
    : Number(form.unitCost)

// En modo Hoja, si no se cargan los campos de resma se conserva el costo vigente
// (relevante al editar un insumo existente sin querer tocar su costo).
const hasValidCost = (form: FormState) =>
  form.unit === 'Hoja'
    ? (!!form.packPrice && !!form.packQuantity) || !!form.unitCost
    : !!form.unitCost

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

export function Supplies() {
  const {
    supplies,
    supplyTypes,
    supplyCostHistory,
    addSupply,
    updateSupply,
    deleteSupply,
    addSupplyType,
    updateSupplyType,
    deleteSupplyType,
  } = useAppContext()
  const { viewMode } = useViewMode()

  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState('Todos')
  const [historySupplyId, setHistorySupplyId] = useState<string | null>(null)

  const [editSupplyId, setEditSupplyId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editing, setEditing] = useState(false)

  const [deleteSupplyId, setDeleteSupplyId] = useState<string | null>(null)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleting, setDeleting] = useState(false)

  // ── Gestión de tipos de insumo ──────────────────────────────────────────
  const [showTypesModal, setShowTypesModal] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [typeSaving, setTypeSaving] = useState(false)
  const [typeError, setTypeError] = useState('')
  const [editTypeId, setEditTypeId] = useState<string | null>(null)
  const [editTypeName, setEditTypeName] = useState('')
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null)

  const typeName = (supplyTypeId: string) =>
    supplyTypes.find((t) => t.id === supplyTypeId)?.name ?? '—'

  const filteredSupplies = supplies.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      typeName(s.supplyTypeId).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedTypeId === 'Todos' || s.supplyTypeId === selectedTypeId
    return matchesSearch && matchesType
  })

  // ── ADD SUPPLY ──────────────────────────────────────────────────────────

  const handleAddSupply = async () => {
    if (!form.name.trim() || !form.supplyTypeId || !hasValidCost(form)) return
    setSaving(true)
    await addSupply({
      name: form.name.trim(),
      supplyTypeId: form.supplyTypeId,
      unit: form.unit,
      unitCost: resolveUnitCost(form),
      active: form.active,
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
      supplyTypeId: supply.supplyTypeId,
      unit: supply.unit,
      unitCost: supply.unitCost.toString(),
      packPrice: '',
      packQuantity: '',
      active: supply.active,
      emoji: supply.emoji,
    })
  }

  const handleSaveEdit = async () => {
    if (!editSupplyId || !editForm.name.trim() || !editForm.supplyTypeId || !hasValidCost(editForm))
      return
    setEditing(true)
    try {
      await updateSupply(editSupplyId, {
        name: editForm.name.trim(),
        supplyTypeId: editForm.supplyTypeId,
        unit: editForm.unit,
        unitCost: resolveUnitCost(editForm),
        active: editForm.active,
        emoji: editForm.emoji,
      })
      setEditSupplyId(null)
      setEditForm(EMPTY_FORM)
    } catch (error) {
      console.error(error)
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
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteSupplyId(null)
    setDeleteStep(1)
  }

  // ── TIPOS DE INSUMO ──────────────────────────────────────────────────────

  const handleAddType = async () => {
    if (!newTypeName.trim()) return
    setTypeSaving(true)
    setTypeError('')
    try {
      await addSupplyType(newTypeName.trim())
      setNewTypeName('')
    } catch (error) {
      setTypeError('No se pudo crear el tipo. Intentá de nuevo.')
    } finally {
      setTypeSaving(false)
    }
  }

  const handleStartEditType = (id: string, name: string) => {
    setEditTypeId(id)
    setEditTypeName(name)
  }

  const handleSaveEditType = async () => {
    if (!editTypeId || !editTypeName.trim()) return
    setTypeSaving(true)
    setTypeError('')
    try {
      await updateSupplyType(editTypeId, editTypeName.trim())
      setEditTypeId(null)
      setEditTypeName('')
    } catch (error) {
      setTypeError('No se pudo actualizar el tipo. Intentá de nuevo.')
    } finally {
      setTypeSaving(false)
    }
  }

  const handleDeleteType = async (id: string) => {
    setTypeSaving(true)
    try {
      await deleteSupplyType(id)
    } catch (error) {
      console.error(error)
    } finally {
      // El toast de AppContext ya informa éxito o error; la confirmación
      // no necesita quedar abierta en ningún caso.
      setDeleteTypeId(null)
      setTypeSaving(false)
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[140px] bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
          />
          <div className="flex items-center gap-2 shrink-0">
            <ViewToggle />
            <button
              onClick={() => setShowTypesModal(true)}
              className="bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-200 transition-colors shrink-0"
              title="Gestionar tipos de insumo"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-lilac-100 text-lilac-600 p-2.5 rounded-xl hover:bg-lilac-200 transition-colors shrink-0"
              title="Agregar insumo"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {supplyTypes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTypeId('Todos')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedTypeId === 'Todos'
                  ? 'bg-lilac-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {supplyTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTypeId(t.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedTypeId === t.id
                    ? 'bg-lilac-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Supplies List */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
          {filteredSupplies.map((supply) => {
            if (viewMode === 'list' && editSupplyId !== supply.id) {
              return (
                <motion.div
                  key={supply.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`bg-white rounded-xl px-3 py-2.5 border border-slate-100 shadow-sm flex items-center gap-3 ${
                    !supply.active ? 'opacity-60' : ''
                  }`}
                >
                  <span className="text-xl shrink-0">{supply.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-slate-800 truncate text-sm">{supply.name}</h3>
                      {!supply.active && (
                        <span className="text-[9px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {typeName(supply.supplyTypeId)} · {supply.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(supply.unitCost)}</p>
                    <p className="text-xs text-slate-400">/ {supply.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(supply)}
                      className="p-2 bg-lilac-100 text-lilac-600 rounded-lg hover:bg-lilac-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setHistorySupplyId(supply.id)}
                      className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Historial de costos"
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={() => handleStartDelete(supply.id)}
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
              key={supply.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${
                !supply.active ? 'opacity-60' : ''
              }`}
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

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Tipo de insumo
                    </label>
                    <select
                      value={editForm.supplyTypeId}
                      onChange={(e) => setEditForm((f) => ({ ...f, supplyTypeId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    >
                      <option value="">— Tipo de insumo —</option>
                      {supplyTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Unidad de medida
                    </label>
                    <select
                      value={editForm.unit}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, unit: e.target.value as UnitOfMeasure }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                    >
                      {UNITS_OF_MEASURE.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editForm.unit === 'Hoja' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Precio de la resma y hojas que contiene
                      </label>
                      <p className="text-xs text-slate-400 mb-1">
                        Costo vigente actual: {formatCurrency(Number(editForm.unitCost) || 0)} / hoja.
                        Dejá estos campos en blanco si no querés modificarlo.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editForm.packPrice}
                          onChange={(e) => setEditForm((f) => ({ ...f, packPrice: e.target.value }))}
                          placeholder="Precio de la resma"
                          min="0"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                        />
                        <input
                          type="number"
                          value={editForm.packQuantity}
                          onChange={(e) => setEditForm((f) => ({ ...f, packQuantity: e.target.value }))}
                          placeholder="Hojas por resma"
                          min="0"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                        />
                      </div>
                      {editForm.packPrice && editForm.packQuantity && (
                        <p className="text-xs text-slate-500 mt-1">
                          Nuevo costo: {formatCurrency(resolveUnitCost(editForm))} / hoja
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Costo vigente
                      </label>
                      <input
                        type="number"
                        value={editForm.unitCost}
                        onChange={(e) => setEditForm((f) => ({ ...f, unitCost: e.target.value }))}
                        placeholder="Costo"
                        min="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
                      className="rounded border-slate-300 text-lilac-500 focus:ring-lilac-300"
                    />
                    Activo
                    <InfoTooltip text={ACTIVE_TOOLTIP} />
                  </label>

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
                      disabled={editing || !editForm.name.trim() || !editForm.supplyTypeId || !hasValidCost(editForm)}
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
                        <p className="text-xs text-slate-400">
                          {typeName(supply.supplyTypeId)} · {supply.unit}
                        </p>
                      </div>
                    </div>
                    {!supply.active && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-sm font-bold text-slate-800">
                      {formatCurrency(supply.unitCost)}{' '}
                      <span className="text-xs font-normal text-slate-400">/ {supply.unit}</span>
                    </p>
                    <p className="text-xs text-slate-400">Costo vigente</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(supply)}
                      className="px-3 py-2 bg-lilac-100 text-lilac-600 rounded-xl hover:bg-lilac-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setHistorySupplyId(supply.id)}
                      className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                      title="Historial de costos"
                    >
                      <History size={16} />
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
            )
          })}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-500">
                      Tipo de insumo *
                    </label>
                    <button
                      onClick={() => setShowTypesModal(true)}
                      className="text-xs font-medium text-lilac-600 hover:text-lilac-700"
                    >
                      + Nuevo tipo
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={form.supplyTypeId}
                      onChange={(e) => setForm((f) => ({ ...f, supplyTypeId: e.target.value }))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300 pr-8"
                    >
                      <option value="">— Seleccioná un tipo —</option>
                      {supplyTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Unidad de medida *
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit: e.target.value as UnitOfMeasure }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                  >
                    {UNITS_OF_MEASURE.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {form.unit === 'Hoja' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Precio de la resma y hojas que contiene *
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={form.packPrice}
                        onChange={(e) => setForm((f) => ({ ...f, packPrice: e.target.value }))}
                        placeholder="Precio de la resma"
                        min="0"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                      <input
                        type="number"
                        value={form.packQuantity}
                        onChange={(e) => setForm((f) => ({ ...f, packQuantity: e.target.value }))}
                        placeholder="Hojas por resma"
                        min="0"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                      />
                    </div>
                    {form.packPrice && form.packQuantity && (
                      <p className="text-xs text-slate-500 mt-1">
                        Costo por hoja: {formatCurrency(resolveUnitCost(form))}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Costo vigente *
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
                )}

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="rounded border-slate-300 text-lilac-500 focus:ring-lilac-300"
                  />
                  Activo
                  <InfoTooltip text={ACTIVE_TOOLTIP} />
                </label>
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
                  disabled={saving || !form.name.trim() || !form.supplyTypeId || !hasValidCost(form)}
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

      {/* ── Modal de gestión de tipos de insumo ─────────────────────────────── */}
      <AnimatePresence>
        {showTypesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowTypesModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6 shadow-xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Tipos de insumo</h2>
                <button
                  onClick={() => setShowTypesModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Ej: Papeles, Tapas, Pinturas"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                />
                <button
                  onClick={handleAddType}
                  disabled={typeSaving || !newTypeName.trim()}
                  className="bg-lilac-500 text-white px-4 rounded-xl font-medium hover:bg-lilac-600 transition-colors disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>

              {typeError && <p className="text-sm text-red-600 mb-3">{typeError}</p>}

              <div className="overflow-y-auto flex-1 space-y-2">
                {supplyTypes.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-50 rounded-xl p-3 flex items-center gap-2"
                  >
                    {editTypeId === t.id ? (
                      <>
                        <input
                          type="text"
                          value={editTypeName}
                          onChange={(e) => setEditTypeName(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-lilac-300"
                        />
                        <button
                          onClick={handleSaveEditType}
                          disabled={typeSaving || !editTypeName.trim()}
                          className="text-lilac-600 text-sm font-medium disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditTypeId(null)}
                          className="text-slate-400 text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-slate-700">{t.name}</span>
                        <button
                          onClick={() => handleStartEditType(t.id, t.name)}
                          className="text-slate-400 hover:text-slate-600"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTypeId(t.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {supplyTypes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No hay tipos de insumo todavía.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmación de eliminación de tipo ─────────────────────────────── */}
      <AnimatePresence>
        {deleteTypeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Eliminar tipo</h3>
              <p className="text-sm text-slate-500 mb-4">
                ¿Estás seguro de que querés eliminar este tipo de insumo?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTypeId(null)}
                  disabled={typeSaving}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteTypeId && handleDeleteType(deleteTypeId)}
                  disabled={typeSaving}
                  className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {typeSaving ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de historial de costos ────────────────────────────────────── */}
      <AnimatePresence>
        {historySupplyId && (() => {
          const supply = supplies.find((s) => s.id === historySupplyId)
          const history = supplyCostHistory
            .filter((h) => h.supplyId === historySupplyId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setHistorySupplyId(null)}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
              >
                <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      {supply?.emoji} {supply?.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Historial de costos</p>
                  </div>
                  <button
                    onClick={() => setHistorySupplyId(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Todavía no hay cambios de costo registrados.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-slate-500">
                              {entry.supplier}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(entry.date).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400 line-through">
                              {formatCurrency(entry.previousCost)}
                            </span>
                            <span className="text-slate-300">→</span>
                            <span className="font-bold text-slate-800">
                              {formatCurrency(entry.newCost)}
                            </span>
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
    </div>
  )
}
