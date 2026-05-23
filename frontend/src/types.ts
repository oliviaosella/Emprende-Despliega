export type Category = 'Cuadernos' | 'Arte' | 'Papelería' | 'Accesorios'

export interface Product {
  id: string
  name: string
  category: Category
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  emoji: string
}

export interface SaleItem {
  productId: string
  qty: number
  unitPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  date: string
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta'
  isPedido?: boolean
  pedidoDescription?: string
  pedidoDeadline?: string
  pedidoReminder?: string
  pedidoStatus?: 'pendiente' | 'en_progreso' | 'completado'
}

export interface PurchaseItem {
  productId?: string
  customName?: string
  qty: number
  unitCost: number
}

export interface Purchase {
  id: string
  supplier: string
  items: PurchaseItem[]
  total: number
  date: string
}

export interface AccountingEntry {
  id: string
  type: 'ingreso' | 'egreso' | 'impuesto'
  description: string
  amount: number
  date: string
  category?: string
}
