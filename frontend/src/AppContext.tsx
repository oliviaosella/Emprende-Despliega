import { useState, createContext, useContext, useEffect, type ReactNode } from 'react'
import { supabase } from './lib/supabase'
import { useToast } from './components/Toast'
import type {
  Product,
  Sale,
  Purchase,
  AccountingEntry,
  SaleItem,
  PurchaseItem,
  Category,
  Supply,
  SupplyType,
  SupplyCostHistoryEntry,
  BomItem,
} from './types'

interface AppContextType {
  products: Product[]
  sales: Sale[]
  purchases: Purchase[]
  accounting: AccountingEntry[]
  supplies: Supply[]
  supplyTypes: SupplyType[]
  supplyCostHistory: SupplyCostHistoryEntry[]
  bomItems: BomItem[]
  businessName: string
  setBusinessName: (name: string) => void
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
  updateProduct: (productId: string, updates: Omit<Product, 'id'>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  addSupply: (supply: Omit<Supply, 'id'>) => Promise<void>
  updateSupply: (supplyId: string, updates: Omit<Supply, 'id'>) => Promise<void>
  deleteSupply: (supplyId: string) => Promise<void>
  addSupplyType: (name: string) => Promise<void>
  updateSupplyType: (supplyTypeId: string, name: string) => Promise<void>
  deleteSupplyType: (supplyTypeId: string) => Promise<void>
  addBomItem: (productId: string, supplyId: string, quantity: number) => Promise<void>
  updateBomItem: (bomItemId: string, quantity: number) => Promise<void>
  deleteBomItem: (bomItemId: string) => Promise<void>
}

// ── DB row → app type mappers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    productType: row.product_type as Product['productType'],
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
    supplyId: pi.supply_id ?? undefined,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSupply(row: any): Supply {
  return {
    id: row.id,
    name: row.name,
    supplyTypeId: row.supply_type_id,
    unit: row.unit,
    unitCost: row.unit_cost,
    active: row.active,
    emoji: row.emoji,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSupplyType(row: any): SupplyType {
  return {
    id: row.id,
    name: row.name,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSupplyCostHistory(row: any): SupplyCostHistoryEntry {
  return {
    id: row.id,
    supplyId: row.supply_id,
    purchaseId: row.purchase_id ?? undefined,
    supplier: row.supplier,
    previousCost: row.previous_cost,
    newCost: row.new_cost,
    date: row.date,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBomItem(row: any): BomItem {
  return {
    id: row.id,
    productId: row.product_id,
    supplyId: row.supply_id,
    quantity: Number(row.quantity),
  }
}

// ── Context ────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [accounting, setAccounting] = useState<AccountingEntry[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [supplyTypes, setSupplyTypes] = useState<SupplyType[]>([])
  const [supplyCostHistory, setSupplyCostHistory] = useState<SupplyCostHistoryEntry[]>([])
  const [bomItems, setBomItems] = useState<BomItem[]>([])
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    loadAll()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const empresa = user?.user_metadata?.empresa
      if (empresa && typeof empresa === 'string') {
        setBusinessName(empresa)
      }
    })
  }, [])

  async function loadAll() {
    setLoading(true)
    const [
      productsRes,
      salesRes,
      purchasesRes,
      accountingRes,
      suppliesRes,
      supplyTypesRes,
      supplyCostHistoryRes,
      bomItemsRes,
    ] = await Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false }),
      supabase
        .from('purchases')
        .select('*, purchase_items(*)')
        .order('date', { ascending: false }),
      supabase.from('accounting_entries').select('*').order('date', { ascending: false }),
      supabase.from('supplies').select('*').order('created_at'),
      supabase.from('supply_types').select('*').order('name'),
      supabase.from('supply_cost_history').select('*').order('date', { ascending: false }),
      supabase.from('product_bom_items').select('*').order('created_at'),
    ])
    if (productsRes.data) setProducts(productsRes.data.map(rowToProduct))
    if (salesRes.data) setSales(salesRes.data.map(rowToSale))
    if (purchasesRes.data) setPurchases(purchasesRes.data.map(rowToPurchase))
    if (accountingRes.data) setAccounting(accountingRes.data.map(rowToAccounting))
    if (suppliesRes.data) setSupplies(suppliesRes.data.map(rowToSupply))
    if (supplyTypesRes.data) setSupplyTypes(supplyTypesRes.data.map(rowToSupplyType))
    if (supplyCostHistoryRes.data)
      setSupplyCostHistory(supplyCostHistoryRes.data.map(rowToSupplyCostHistory))
    if (bomItemsRes.data) setBomItems(bomItemsRes.data.map(rowToBomItem))
    setLoading(false)
  }

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category: product.category,
        product_type: product.productType,
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        stock: product.stock,
        min_stock: product.minStock,
        emoji: product.emoji,
      })
      .select()
      .single()
    if (error) {
      showToast('No se pudo crear el producto.', 'error')
      return
    }
    setProducts((prev) => [...prev, rowToProduct(data)])
    showToast('Producto creado correctamente.')
  }

  const updateProduct = async (productId: string, updates: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        category: updates.category,
        product_type: updates.productType,
        cost_price: updates.costPrice,
        sale_price: updates.salePrice,
        stock: updates.stock,
        min_stock: updates.minStock,
        emoji: updates.emoji,
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      showToast('No se pudo actualizar el producto.', 'error')
      throw error
    }

    if (data) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? rowToProduct(data) : p)))
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { id: productId, ...updates } : p)),
      )
    }
    showToast('Producto actualizado correctamente.')
  }

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      showToast('No se pudo eliminar el producto. Verificá si tiene ventas o compras asociadas.', 'error')
      throw error
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    showToast('Producto eliminado correctamente.')
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
        pedido_description: pedidoData?.description || null,
        pedido_deadline: pedidoData?.deadline || null,
        pedido_reminder: pedidoData?.reminder || null,
        pedido_status: pedidoData ? 'pendiente' : null,
      })
      .select()
      .single()

    if (!saleData) {
      showToast('No se pudo registrar la venta.', 'error')
      return
    }

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
      showToast('Venta registrada correctamente.')
    } else {
      showToast('Pedido registrado correctamente.')
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
    showToast('Pedido completado correctamente.')
  }

  const updatePedidoStatus = async (saleId: string, status: Sale['pedidoStatus']) => {
    await supabase.from('sales').update({ pedido_status: status }).eq('id', saleId)
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, pedidoStatus: status } : s)),
    )
    showToast('Estado del pedido actualizado.')
  }

  const addPurchase = async (supplier: string, items: PurchaseItem[]) => {
    const total = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0)

    const { data: purchaseData } = await supabase
      .from('purchases')
      .insert({ supplier, total, date: new Date().toISOString() })
      .select()
      .single()

    if (!purchaseData) {
      showToast('No se pudo registrar la compra.', 'error')
      return
    }

    await supabase.from('purchase_items').insert(
      items.map((item) => ({
        purchase_id: purchaseData.id,
        product_id: item.productId ?? null,
        supply_id: item.supplyId ?? null,
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
        const isReventa = product.productType === 'reventa'
        const newCostPrice = isReventa ? item.unitCost : product.costPrice
        await supabase
          .from('products')
          .update({ stock: newStock, cost_price: newCostPrice })
          .eq('id', item.productId)
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.productId ? { ...p, stock: newStock, costPrice: newCostPrice } : p,
          ),
        )
      }
    }

    let updatedSupplies = supplies
    const affectedSupplyIds: string[] = []

    for (const item of items) {
      if (!item.supplyId) continue
      const supply = updatedSupplies.find((s) => s.id === item.supplyId)
      if (!supply) continue
      const previousCost = supply.unitCost

      await supabase.from('supplies').update({ unit_cost: item.unitCost }).eq('id', item.supplyId)
      updatedSupplies = updatedSupplies.map((s) =>
        s.id === item.supplyId ? { ...s, unitCost: item.unitCost } : s,
      )
      setSupplies(updatedSupplies)
      affectedSupplyIds.push(item.supplyId)

      const { data: historyData } = await supabase
        .from('supply_cost_history')
        .insert({
          supply_id: item.supplyId,
          purchase_id: purchaseData.id,
          supplier,
          previous_cost: previousCost,
          new_cost: item.unitCost,
          date: purchaseData.date,
        })
        .select()
        .single()
      if (historyData) {
        setSupplyCostHistory((prev) => [rowToSupplyCostHistory(historyData), ...prev])
      }
    }

    const affectedProductIds = Array.from(
      new Set(
        bomItems
          .filter((b) => affectedSupplyIds.includes(b.supplyId))
          .map((b) => b.productId),
      ),
    )
    for (const productId of affectedProductIds) {
      await recalcProductCost(productId, bomItems, updatedSupplies)
    }

    await addAccountingEntry({
      type: 'egreso',
      description: `Compra a ${supplier}`,
      amount: total,
      category: 'Insumos',
    })
    showToast('Compra registrada correctamente.')
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
    showToast('Stock actualizado correctamente.')
  }

  const computeFabricatedCost = (productId: string, items: BomItem[], supplyList: Supply[]) =>
    items
      .filter((b) => b.productId === productId)
      .reduce((sum, b) => {
        const supply = supplyList.find((s) => s.id === b.supplyId)
        return sum + b.quantity * (supply?.unitCost ?? 0)
      }, 0)

  const recalcProductCost = async (productId: string, items: BomItem[], supplyList: Supply[]) => {
    const product = products.find((p) => p.id === productId)
    if (!product || product.productType !== 'fabricado') return
    const newCost = computeFabricatedCost(productId, items, supplyList)
    if (newCost === product.costPrice) return
    await supabase.from('products').update({ cost_price: newCost }).eq('id', productId)
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, costPrice: newCost } : p)))
  }

  const addBomItem = async (productId: string, supplyId: string, quantity: number) => {
    const { data, error } = await supabase
      .from('product_bom_items')
      .insert({ product_id: productId, supply_id: supplyId, quantity })
      .select()
      .single()
    if (error) {
      showToast('No se pudo agregar el insumo a la lista de materiales.', 'error')
      throw error
    }
    const nextBomItems = [...bomItems, rowToBomItem(data)]
    setBomItems(nextBomItems)
    await recalcProductCost(productId, nextBomItems, supplies)
    showToast('Insumo agregado a la lista de materiales.')
  }

  const updateBomItem = async (bomItemId: string, quantity: number) => {
    const existing = bomItems.find((b) => b.id === bomItemId)
    if (!existing) return
    const { data, error } = await supabase
      .from('product_bom_items')
      .update({ quantity })
      .eq('id', bomItemId)
      .select()
      .single()
    if (error) {
      showToast('No se pudo actualizar la cantidad.', 'error')
      throw error
    }
    const nextBomItems = bomItems.map((b) => (b.id === bomItemId ? rowToBomItem(data) : b))
    setBomItems(nextBomItems)
    await recalcProductCost(existing.productId, nextBomItems, supplies)
    showToast('Cantidad actualizada correctamente.')
  }

  const deleteBomItem = async (bomItemId: string) => {
    const existing = bomItems.find((b) => b.id === bomItemId)
    if (!existing) return
    const { error } = await supabase.from('product_bom_items').delete().eq('id', bomItemId)
    if (error) {
      showToast('No se pudo eliminar el insumo de la lista de materiales.', 'error')
      throw error
    }
    const nextBomItems = bomItems.filter((b) => b.id !== bomItemId)
    setBomItems(nextBomItems)
    await recalcProductCost(existing.productId, nextBomItems, supplies)
    showToast('Insumo eliminado de la lista de materiales.')
  }

  const addSupply = async (supply: Omit<Supply, 'id'>) => {
    const { data, error } = await supabase
      .from('supplies')
      .insert({
        name: supply.name,
        supply_type_id: supply.supplyTypeId,
        unit: supply.unit,
        unit_cost: supply.unitCost,
        active: supply.active,
        emoji: supply.emoji,
      })
      .select()
      .single()
    if (error) {
      showToast('No se pudo crear el insumo.', 'error')
      return
    }
    setSupplies((prev) => [...prev, rowToSupply(data)])
    showToast('Insumo creado correctamente.')
  }

  const updateSupply = async (supplyId: string, updates: Omit<Supply, 'id'>) => {
    const { data, error } = await supabase
      .from('supplies')
      .update({
        name: updates.name,
        supply_type_id: updates.supplyTypeId,
        unit: updates.unit,
        unit_cost: updates.unitCost,
        active: updates.active,
        emoji: updates.emoji,
      })
      .eq('id', supplyId)
      .select()
      .single()

    if (error) {
      showToast('No se pudo actualizar el insumo.', 'error')
      throw error
    }

    if (data) {
      setSupplies((prev) => prev.map((s) => (s.id === supplyId ? rowToSupply(data) : s)))
    } else {
      setSupplies((prev) =>
        prev.map((s) => (s.id === supplyId ? { id: supplyId, ...updates } : s)),
      )
    }
    showToast('Insumo actualizado correctamente.')
  }

  const deleteSupply = async (supplyId: string) => {
    const { error } = await supabase.from('supplies').delete().eq('id', supplyId)
    if (error) {
      if (error.code === '23503') {
        const message =
          'No se puede eliminar: el insumo tiene compras registradas o está en una lista de materiales. Marcalo como inactivo.'
        showToast(message, 'error')
        throw new Error(message)
      }
      showToast('No se pudo eliminar el insumo.', 'error')
      throw error
    }
    setSupplies((prev) => prev.filter((s) => s.id !== supplyId))
    showToast('Insumo eliminado correctamente.')
  }

  const addSupplyType = async (name: string) => {
    const { data, error } = await supabase
      .from('supply_types')
      .insert({ name })
      .select()
      .single()
    if (error) {
      showToast('No se pudo crear el tipo de insumo.', 'error')
      throw error
    }
    setSupplyTypes((prev) => [...prev, rowToSupplyType(data)])
    showToast('Tipo de insumo creado correctamente.')
  }

  const updateSupplyType = async (supplyTypeId: string, name: string) => {
    const { data, error } = await supabase
      .from('supply_types')
      .update({ name })
      .eq('id', supplyTypeId)
      .select()
      .single()
    if (error) {
      showToast('No se pudo actualizar el tipo de insumo.', 'error')
      throw error
    }
    setSupplyTypes((prev) => prev.map((t) => (t.id === supplyTypeId ? rowToSupplyType(data) : t)))
    showToast('Tipo de insumo actualizado correctamente.')
  }

  const deleteSupplyType = async (supplyTypeId: string) => {
    const { error } = await supabase.from('supply_types').delete().eq('id', supplyTypeId)
    if (error) {
      if (error.code === '23503') {
        const message = 'No se puede eliminar: hay insumos que usan este tipo.'
        showToast(message, 'error')
        throw new Error(message)
      }
      showToast('No se pudo eliminar el tipo de insumo.', 'error')
      throw error
    }
    setSupplyTypes((prev) => prev.filter((t) => t.id !== supplyTypeId))
    showToast('Tipo de insumo eliminado correctamente.')
  }

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        purchases,
        accounting,
        supplies,
        supplyTypes,
        supplyCostHistory,
        bomItems,
        businessName,
        setBusinessName,
        loading,
        addProduct,
        addSale,
        completePedido,
        updatePedidoStatus,
        addPurchase,
        addAccountingEntry,
        updateProductStock,
        updateProduct,
        deleteProduct,
        addSupply,
        updateSupply,
        deleteSupply,
        addSupplyType,
        updateSupplyType,
        deleteSupplyType,
        addBomItem,
        updateBomItem,
        deleteBomItem,
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
