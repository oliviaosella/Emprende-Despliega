import { useState, createContext, useContext, useEffect, type ReactNode } from 'react'
import { supabase } from './lib/supabase'
import type {
  Product,
  Sale,
  Purchase,
  AccountingEntry,
  SaleItem,
  PurchaseItem,
  Category,
} from './types'

interface AppContextType {
  products: Product[]
  sales: Sale[]
  purchases: Purchase[]
  accounting: AccountingEntry[]
  loading: boolean
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  addSale: (
    items: SaleItem[],
    paymentMethod: Sale['paymentMethod'],
    pedidoData?: { description: string; deadline: string; reminder?: string },
  ) => Promise<void>
  completePedido: (saleId: string) => Promise<void>
  updatePedidoStatus: (saleId: string, status: Sale['pedidoStatus']) => Promise<void>
  addPurchase: (supplier: string, items: PurchaseItem[]) => Promise<void>
  addAccountingEntry: (entry: Omit<AccountingEntry, 'id' | 'date'>) => Promise<void>
  updateProductStock: (productId: string, newStock: number) => Promise<void>
}

// ── DB row → app type mappers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    stock: row.stock,
    minStock: row.min_stock,
    emoji: row.emoji,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSale(row: any): Sale {
  const items: SaleItem[] = (row.sale_items ?? []).map((si: any) => ({
    productId: si.product_id,
    qty: si.qty,
    unitPrice: si.unit_price,
  }))
  return {
    id: row.id,
    items,
    total: row.total,
    date: row.date,
    paymentMethod: row.payment_method as Sale['paymentMethod'],
    isPedido: row.is_pedido ?? undefined,
    pedidoDescription: row.pedido_description ?? undefined,
    pedidoDeadline: row.pedido_deadline ?? undefined,
    pedidoReminder: row.pedido_reminder ?? undefined,
    pedidoStatus: (row.pedido_status as Sale['pedidoStatus']) ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPurchase(row: any): Purchase {
  const items: PurchaseItem[] = (row.purchase_items ?? []).map((pi: any) => ({
    productId: pi.product_id ?? undefined,
    customName: pi.custom_name ?? undefined,
    qty: pi.qty,
    unitCost: pi.unit_cost,
  }))
  return {
    id: row.id,
    supplier: row.supplier,
    items,
    total: row.total,
    date: row.date,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAccounting(row: any): AccountingEntry {
  return {
    id: row.id,
    type: row.type as AccountingEntry['type'],
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category ?? undefined,
  }
}

// ── Context ────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [accounting, setAccounting] = useState<AccountingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [productsRes, salesRes, purchasesRes, accountingRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false }),
      supabase.from('purchases').select('*, purchase_items(*)').order('date', { ascending: false }),
      supabase.from('accounting_entries').select('*').order('date', { ascending: false }),
    ])
    if (productsRes.data) setProducts(productsRes.data.map(rowToProduct))
    if (salesRes.data) setSales(salesRes.data.map(rowToSale))
    if (purchasesRes.data) setPurchases(purchasesRes.data.map(rowToPurchase))
    if (accountingRes.data) setAccounting(accountingRes.data.map(rowToAccounting))
    setLoading(false)
  }

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category: product.category,
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        stock: product.stock,
        min_stock: product.minStock,
        emoji: product.emoji,
      })
      .select()
      .single()
    if (data) setProducts((prev) => [...prev, rowToProduct(data)])
  }

  const addSale = async (
    items: SaleItem[],
    paymentMethod: Sale['paymentMethod'],
    pedidoData?: { description: string; deadline: string; reminder?: string },
  ) => {
    const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)

    const { data: saleData } = await supabase
      .from('sales')
      .insert({
        total,
        date: new Date().toISOString(),
        payment_method: paymentMethod,
        is_pedido: pedidoData ? true : false,
        pedido_description: pedidoData?.description ?? null,
        pedido_deadline: pedidoData?.deadline ?? null,
        pedido_reminder: pedidoData?.reminder ?? null,
        pedido_status: pedidoData ? 'pendiente' : null,
      })
      .select()
      .single()

    if (!saleData) return

    await supabase.from('sale_items').insert(
      items.map((item) => ({
        sale_id: saleData.id,
        product_id: item.productId,
        qty: item.qty,
        unit_price: item.unitPrice,
      })),
    )

    const newSale: Sale = { ...rowToSale(saleData), items }
    setSales((prev) => [newSale, ...prev])

    if (!pedidoData) {
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)
        if (product) {
          const newStock = Math.max(0, product.stock - item.qty)
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId)
          setProducts((prev) =>
            prev.map((p) => (p.id === item.productId ? { ...p, stock: newStock } : p)),
          )
        }
      }
      await addAccountingEntry({
        type: 'ingreso',
        description: `Venta #${saleData.id.slice(-4)}`,
        amount: total,
        category: 'Ventas',
      })
    }
  }

  const completePedido = async (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    if (!sale || sale.pedidoStatus === 'completado') return

    await supabase.from('sales').update({ pedido_status: 'completado' }).eq('id', saleId)
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, pedidoStatus: 'completado' } : s)),
    )

    for (const item of sale.items) {
      const product = products.find((p) => p.id === item.productId)
      if (product) {
        const newStock = Math.max(0, product.stock - item.qty)
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId)
        setProducts((prev) =>
          prev.map((p) => (p.id === item.productId ? { ...p, stock: newStock } : p)),
        )
      }
    }

    await addAccountingEntry({
      type: 'ingreso',
      description: `Pedido Completado #${sale.id.slice(-4)}`,
      amount: sale.total,
      category: 'Ventas',
    })
  }

  const updatePedidoStatus = async (saleId: string, status: Sale['pedidoStatus']) => {
    await supabase.from('sales').update({ pedido_status: status }).eq('id', saleId)
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, pedidoStatus: status } : s)),
    )
  }

  const addPurchase = async (supplier: string, items: PurchaseItem[]) => {
    const total = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0)

    const { data: purchaseData } = await supabase
      .from('purchases')
      .insert({ supplier, total, date: new Date().toISOString() })
      .select()
      .single()

    if (!purchaseData) return

    await supabase.from('purchase_items').insert(
      items.map((item) => ({
        purchase_id: purchaseData.id,
        product_id: item.productId ?? null,
        custom_name: item.customName ?? null,
        qty: item.qty,
        unit_cost: item.unitCost,
      })),
    )

    const newPurchase: Purchase = { id: purchaseData.id, supplier, items, total, date: purchaseData.date }
    setPurchases((prev) => [newPurchase, ...prev])

    for (const item of items) {
      if (!item.productId) continue
      const product = products.find((p) => p.id === item.productId)
      if (product) {
        const newStock = product.stock + item.qty
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId)
        setProducts((prev) =>
          prev.map((p) => (p.id === item.productId ? { ...p, stock: newStock } : p)),
        )
      }
    }

    await addAccountingEntry({
      type: 'egreso',
      description: `Compra a ${supplier}`,
      amount: total,
      category: 'Insumos',
    })
  }

  const addAccountingEntry = async (entry: Omit<AccountingEntry, 'id' | 'date'>) => {
    const { data } = await supabase
      .from('accounting_entries')
      .insert({
        type: entry.type,
        description: entry.description,
        amount: entry.amount,
        date: new Date().toISOString(),
        category: entry.category ?? null,
      })
      .select()
      .single()
    if (data) setAccounting((prev) => [rowToAccounting(data), ...prev])
  }

  const updateProductStock = async (productId: string, newStock: number) => {
    await supabase.from('products').update({ stock: newStock }).eq('id', productId)
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)))
  }

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        purchases,
        accounting,
        loading,
        addProduct,
        addSale,
        completePedido,
        updatePedidoStatus,
        addPurchase,
        addAccountingEntry,
        updateProductStock,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
