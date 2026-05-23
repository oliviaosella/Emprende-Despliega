
import { useAppContext } from '../AppContext'
import { TrendingUp, AlertCircle, Package, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

export function Dashboard() {
  const { products, sales, accounting } = useAppContext()

  // Calculate metrics
  const today = new Date().toISOString().split('T')[0]
  const todaySales = sales.filter((s) => s.date.startsWith(today))
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock)
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stock * p.costPrice,
    0,
  )
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyIncome = accounting
    .filter(
      (a) =>
        a.type === 'ingreso' &&
        new Date(a.date).getMonth() === currentMonth &&
        new Date(a.date).getFullYear() === currentYear,
    )
    .reduce((sum, a) => sum + a.amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '¡Buen día!'
    if (hour < 19) return '¡Buenas tardes!'
    return '¡Buenas noches!'
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
          {greeting()}
        </h1>
        <p className="text-slate-500">
          Aquí está el resumen de tu emprendimiento.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className="bg-gradient-to-br from-lilac-500 to-lilac-600 p-4 rounded-2xl text-white shadow-lg shadow-lilac-200"
        >
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Ventas Hoy</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
          <p className="text-xs mt-1 opacity-80">{todaySales.length} ventas</p>
        </motion.div>

        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2 text-pink-500">
            <DollarSign size={18} />
            <span className="text-sm font-medium text-slate-600">
              Ingresos Mes
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(monthlyIncome)}
          </p>
        </motion.div>

        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className="bg-white p-4 rounded-2xl border border-lilac-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2 text-lilac-500">
            <Package size={18} />
            <span className="text-sm font-medium text-slate-600">
              Valor Stock
            </span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {formatCurrency(totalInventoryValue)}
          </p>
          <p className="text-xs mt-1 text-slate-400">Costo total</p>
        </motion.div>

        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className={`${lowStockProducts.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm`}
        >
          <div
            className={`flex items-center gap-2 mb-2 ${lowStockProducts.length > 0 ? 'text-red-500' : 'text-slate-400'}`}
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium text-slate-600">
              Bajo Stock
            </span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {lowStockProducts.length}
          </p>
          <p className="text-xs mt-1 text-slate-400">Productos</p>
        </motion.div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">
            Atención: Stock Bajo
          </h2>
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-50">
            {lowStockProducts.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="p-4 flex items-center justify-between bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Quedan {product.stock} (Mín: {product.minStock})
                    </p>
                  </div>
                </div>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">
                  Reponer
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">
          Últimas Ventas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sales.slice(0, 3).map((sale) => (
            <div
              key={sale.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {sale.items.reduce((sum, item) => sum + item.qty, 0)}{' '}
                  productos
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(sale.date).toLocaleDateString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  • {sale.paymentMethod}
                </p>
              </div>
              <p className="font-bold text-lilac-600">
                {formatCurrency(sale.total)}
              </p>
            </div>
          ))}
          {sales.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">
              Aún no hay ventas registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
