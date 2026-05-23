import { useState } from 'react'
import { useAppContext } from '../AppContext'
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  CheckCircle2,
  CalendarClock,
  CircleDashed,
  PlayCircle,
  PackageSearch,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SaleItem, Product } from '../types'

export function Sales() {
  const { products, sales, addSale, completePedido, updatePedidoStatus } =
    useAppContext()
  const [view, setView] = useState<'vender' | 'pedidos'>('vender')
  const [cart, setCart] = useState<SaleItem[]>([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<
    'Efectivo' | 'Transferencia' | 'Tarjeta'
  >('Transferencia')
  // Pedido specific state
  const [isPedidoToggle, setIsPedidoToggle] = useState(false)
  const [pedidoDesc, setPedidoDesc] = useState('')
  const [pedidoDeadline, setPedidoDeadline] = useState('')
  const [pedidoReminder, setPedidoReminder] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')

  const categories = [
    'Todos',
    ...Array.from(new Set(products.map((p) => p.category))),
  ]

  const filteredProducts =
    selectedCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === selectedCategory)

  const pedidos = sales
    .filter((s) => s.isPedido)
    .sort(
      (a, b) =>
        new Date(a.pedidoDeadline || 0).getTime() -
        new Date(b.pedidoDeadline || 0).getTime(),
    )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        if (existing.qty >= product.stock) return prev
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          qty: 1,
          unitPrice: product.salePrice,
        },
      ]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId)
            const newQty = Math.max(
              0,
              Math.min(item.qty + delta, product?.stock || 0),
            )
            return {
              ...item,
              qty: newQty,
            }
          }
          return item
        })
        .filter((item) => item.qty > 0)
    })
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0,
  )
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const handleConfirmSale = () => {
    if (cart.length === 0) return
    if (isPedidoToggle) {
      if (!pedidoDeadline) {
        alert('Por favor ingresa una fecha de entrega para el pedido.')
        return
      }
      addSale(cart, paymentMethod, {
        description: pedidoDesc,
        deadline: pedidoDeadline,
        reminder: pedidoReminder,
      })
      setToastMessage('¡Pedido registrado!')
    } else {
      addSale(cart, paymentMethod)
      setToastMessage('¡Venta registrada!')
    }
    setCart([])
    setIsConfirming(false)
    setIsPedidoToggle(false)
    setPedidoDesc('')
    setPedidoDeadline('')
    setPedidoReminder('')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const getDeadlineColor = (deadline?: string, status?: string) => {
    if (!deadline || status === 'completado') return 'text-slate-500'
    const days =
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    if (days < 0) return 'text-red-500 font-bold'
    if (days <= 2) return 'text-yellow-600 font-bold'
    return 'text-slate-500'
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'en_progreso':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completado':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente'
      case 'en_progreso':
        return 'En progreso'
      case 'completado':
        return 'Completado'
      default:
        return status
    }
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="bg-white p-6 pb-2 rounded-b-3xl shadow-sm border-b border-lilac-50 z-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-4">
          Ventas
        </h1>

        {/* Segmented Control */}
        <div className="bg-slate-100 p-1 rounded-xl flex mb-4 max-w-md">
          <button
            onClick={() => setView('vender')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'vender' ? 'bg-white shadow-sm text-lilac-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Vender
          </button>
          <button
            onClick={() => setView('pedidos')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'pedidos' ? 'bg-white shadow-sm text-lilac-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pedidos
          </button>
        </div>

        {/* Category Pills (Only in Vender view) */}
        {view === 'vender' && (
          <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-lilac-500 text-white shadow-md shadow-lilac-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-40 lg:pb-24">
        {view === 'vender' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const cartItem = cart.find(
                (item) => item.productId === product.id,
              )
              const isOutOfStock = product.stock <= 0
              return (
                <motion.button
                  key={product.id}
                  whileTap={
                    !isOutOfStock
                      ? {
                          scale: 0.95,
                        }
                      : {}
                  }
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={`relative bg-white p-3 rounded-2xl border text-left flex flex-col h-full transition-shadow ${cartItem ? 'border-pink-400 shadow-md shadow-pink-100' : 'border-slate-100 shadow-sm'} ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                >
                  {cartItem && (
                    <div className="absolute -top-2 -right-2 bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                      {cartItem.qty}
                    </div>
                  )}
                  <div className="text-4xl mb-2 text-center bg-slate-50 rounded-xl py-4">
                    {product.emoji}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1 flex-1">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-end mt-2 w-full">
                    <p className="font-bold text-lilac-600 text-sm">
                      {formatCurrency(product.salePrice)}
                    </p>
                    <p className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {product.stock} disp.
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidos.map((pedido) => {
              const mainProduct = products.find(
                (p) => p.id === pedido.items[0].productId,
              )
              const statusColor =
                pedido.pedidoStatus === 'pendiente'
                  ? 'border-l-yellow-400'
                  : pedido.pedidoStatus === 'en_progreso'
                    ? 'border-l-blue-400'
                    : 'border-l-green-400'
              return (
                <motion.div
                  key={pedido.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm border-l-4 ${statusColor}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-slate-50 p-2 rounded-xl">
                        {mainProduct?.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          {mainProduct?.name}{' '}
                          {pedido.items.length > 1 &&
                            `+${pedido.items.length - 1}`}
                        </h3>
                        <p
                          className={`text-xs flex items-center gap-1 mt-1 ${getDeadlineColor(pedido.pedidoDeadline, pedido.pedidoStatus)}`}
                        >
                          <CalendarClock size={12} />
                          Entrega:{' '}
                          {pedido.pedidoDeadline
                            ? new Date(
                                pedido.pedidoDeadline,
                              ).toLocaleDateString('es-AR')
                            : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadge(pedido.pedidoStatus)}`}
                    >
                      {getStatusLabel(pedido.pedidoStatus)}
                    </div>
                  </div>

                  {pedido.pedidoDescription && (
                    <div className="bg-slate-50 p-3 rounded-xl mb-3">
                      <p className="text-xs text-slate-600 italic">
                        "{pedido.pedidoDescription}"
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">
                        Total ({pedido.paymentMethod})
                      </p>
                      <p className="font-bold text-slate-800">
                        {formatCurrency(pedido.total)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {pedido.pedidoStatus === 'pendiente' && (
                        <button
                          onClick={() =>
                            updatePedidoStatus(pedido.id, 'en_progreso')
                          }
                          className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          <PlayCircle size={14} /> Iniciar
                        </button>
                      )}
                      {pedido.pedidoStatus === 'en_progreso' && (
                        <button
                          onClick={() => completePedido(pedido.id)}
                          className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle2 size={14} /> Completar
                        </button>
                      )}
                      {pedido.pedidoStatus === 'completado' && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-bold px-3 py-1.5">
                          <CheckCircle2 size={14} /> Listo
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {pedidos.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <PackageSearch size={48} className="mx-auto mb-4 opacity-20" />
                <p>No hay pedidos registrados.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Summary Bar */}
      <AnimatePresence>
        {cart.length > 0 && !isConfirming && view === 'vender' && (
          <motion.div
            initial={{
              y: 100,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: 100,
              opacity: 0,
            }}
            className="absolute bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-96 bg-slate-800 text-white rounded-2xl p-4 shadow-xl flex justify-between items-center z-40 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => setIsConfirming(true)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-sm font-medium opacity-80">
                  {cartItemsCount} items
                </p>
                <p className="font-bold text-lg">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
            <button className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-xl font-semibold transition-colors">
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal/Sheet */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center pointer-events-none">
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setIsConfirming(false)}
            />
            <motion.div
              initial={{
                y: '100%',
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: '100%',
              }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 200,
              }}
              className="relative w-full lg:w-[500px] bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-slate-800">Confirmar</h2>
                <button
                  onClick={() => setIsConfirming(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-3 mb-6">
                  {cart.map((item) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    )!
                    return (
                      <div
                        key={item.productId}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{product.emoji}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatCurrency(item.unitPrice)} c/u
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <button
                              onClick={() => updateQty(item.productId, -1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-4 text-center font-bold text-sm">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.productId, 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="font-bold text-sm w-16 text-right">
                            {formatCurrency(item.qty * item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-800 mb-2">
                    Método de Pago
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map(
                      (method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 rounded-xl text-xs font-medium border transition-colors ${paymentMethod === method ? 'bg-lilac-50 border-lilac-300 text-lilac-700' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                          {method}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Pedido Toggle & Fields */}
                <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleDashed
                        size={18}
                        className={
                          isPedidoToggle ? 'text-lilac-500' : 'text-slate-400'
                        }
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        ¿Es un pedido?
                      </span>
                    </div>
                    <button
                      onClick={() => setIsPedidoToggle(!isPedidoToggle)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isPedidoToggle ? 'bg-lilac-500' : 'bg-slate-300'}`}
                    >
                      <motion.div
                        layout
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm ${isPedidoToggle ? 'right-1' : 'left-1'}`}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isPedidoToggle && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                          marginTop: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          marginTop: 16,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          marginTop: 0,
                        }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">
                            Descripción del pedido
                          </label>
                          <textarea
                            placeholder="Ej: Cuaderno A5 con nombre grabado..."
                            value={pedidoDesc}
                            onChange={(e) => setPedidoDesc(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-lilac-300 outline-none resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block font-medium">
                              Fecha de entrega *
                            </label>
                            <input
                              type="date"
                              value={pedidoDeadline}
                              onChange={(e) =>
                                setPedidoDeadline(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-lilac-300"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">
                              Recordatorio (opc)
                            </label>
                            <input
                              type="date"
                              value={pedidoReminder}
                              onChange={(e) =>
                                setPedidoReminder(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-lilac-300"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-8 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">
                    Total a cobrar
                  </span>
                  <span className="text-2xl font-bold text-slate-800">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <button
                  onClick={handleConfirmSale}
                  className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-colors flex justify-center items-center gap-2 ${isPedidoToggle ? 'bg-lilac-500 hover:bg-lilac-600 shadow-lilac-200' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}
                >
                  <CheckCircle2 size={24} />
                  {isPedidoToggle ? 'Registrar Pedido' : 'Confirmar Venta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{
              opacity: 0,
              y: -50,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -50,
            }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 z-50 whitespace-nowrap"
          >
            <CheckCircle2 size={20} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
