
import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../AppContext'
import { supabase } from '../lib/supabase'
import {
  TrendingUp,
  AlertCircle,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function Dashboard() {
  const { products, sales, accounting } = useAppContext()
  const [businessName, setBusinessName] = useState('tu emprendimiento')
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const empresa = user?.user_metadata?.empresa
      if (empresa && typeof empresa === 'string') {
        setBusinessName(empresa)
      }
    })
  }, [])

  // Calculate metrics
  const today = new Date().toISOString().split('T')[0]
  const todaySales = sales.filter((s) => s.date.startsWith(today))
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const lowStockProducts = products
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => {
      const aDelta = a.stock - a.minStock
      const bDelta = b.stock - b.minStock
      if (aDelta !== bDelta) return aDelta - bDelta
      return a.stock - b.stock
    })
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

  const saleProductMap = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      acc[product.id] = product.costPrice
      return acc
    }, {})
  }, [products])

  const weeklyProfitData = useMemo(() => {
    const weekLabels = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ]

    const startOfWeek = (date: Date) => {
      const copy = new Date(date)
      const dayIndex = (copy.getDay() + 6) % 7
      copy.setDate(copy.getDate() - dayIndex)
      copy.setHours(0, 0, 0, 0)
      return copy
    }

    const weekStart = startOfWeek(new Date())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const weeklyTotals = new Array(7).fill(0)

    sales
      .filter((sale) => !sale.isPedido || sale.pedidoStatus === 'completado')
      .forEach((sale) => {
        const saleDate = new Date(sale.date)
        if (saleDate < weekStart || saleDate >= weekEnd) return
        const dayIndex = (saleDate.getDay() + 6) % 7
        const cost = sale.items.reduce((sum, item) => {
          const costPrice = saleProductMap[item.productId] ?? 0
          return sum + item.qty * costPrice
        }, 0)
        weeklyTotals[dayIndex] += sale.total - cost
      })

    return weekLabels.map((day, index) => ({
      day,
      profit: weeklyTotals[index],
    }))
  }, [sales, saleProductMap])

  const weeklyProfitTicks = useMemo(() => {
    const step = 50000
    const values = weeklyProfitData.map((item) => item.profit)
    const minValue = Math.min(0, ...values)
    const maxValue = Math.max(0, ...values)
    const start = Math.floor(minValue / step) * step
    const end = Math.ceil(maxValue / step) * step
    const length = Math.max(1, Math.round((end - start) / step) + 1)
    return {
      ticks: Array.from({ length }, (_, index) => start + index * step),
      domain: [start, end] as [number, number],
    }
  }, [weeklyProfitData])

  const recentSales = useMemo(() => {
    return sales
      .filter((sale) => !sale.isPedido || sale.pedidoStatus === 'completado')
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [sales])

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProductName = (productId: string) => {
    return products.find((product) => product.id === productId)?.name ?? 'Producto eliminado'
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
          Buenas tardes, {businessName}!
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
            <span className="text-sm font-medium text-slate-600">Ingresos Mes</span>
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
            <span className="text-sm font-medium text-slate-600">Valor Stock</span>
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
            <span className="text-sm font-medium text-slate-600">Bajo Stock</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            {lowStockProducts.length}
          </p>
          <p className="text-xs mt-1 text-slate-400">Productos</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mb-8">
        <div className="hidden md:block">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Ganancias Semanal</h2>
                <p className="text-xs text-slate-400">
                  Ventas registradas de lunes a domingo
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProfitData} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    ticks={weeklyProfitTicks.ticks}
                    domain={weeklyProfitTicks.domain}
                    tickFormatter={(value: number) => formatCurrency(value)}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  />
                  <Bar dataKey="profit" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          {lowStockProducts.length > 0 ? (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-red-100 bg-red-50/60">
                <h2 className="text-lg font-bold text-slate-800">Atención: Stock Bajo</h2>
                <p className="text-xs text-red-500">Productos críticos primero</p>
              </div>
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 flex items-center justify-between">
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
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-slate-800">Stock Bajo</h2>
              <p className="text-sm text-slate-400 mt-2">
                No hay productos por debajo del mínimo.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">Últimas Ventas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {recentSales.map((sale) => {
            const itemsCount = sale.items.reduce((sum, item) => sum + item.qty, 0)
            const isExpanded = expandedSaleId === sale.id
            return (
              <div
                key={sale.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-800">
                      {itemsCount} productos
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(sale.date)} • {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lilac-600">
                      {formatCurrency(sale.total)}
                    </p>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                    {sale.items.map((item) => (
                      <div
                        key={`${sale.id}-${item.productId}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-700">
                            {getProductName(item.productId)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.qty} x {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-700">
                          {formatCurrency(item.qty * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {recentSales.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">
              Aún no hay ventas registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
