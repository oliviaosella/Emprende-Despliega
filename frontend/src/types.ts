export type Category = string

export const UNITS_OF_MEASURE = [
  'Unidad',
  'Hoja',
  'Litro',
  'ml',
  'Kg',
  'g',
  'Metro',
  'cm',
] as const

export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number]

export interface SupplyType {
  id: string
  name: string
}

export interface Supply {
  id: string
  name: string
  supplyTypeId: string
  unit: UnitOfMeasure
  unitCost: number
  active: boolean
  emoji: string
}

export type ProductType = 'reventa' | 'fabricado'

export interface Product {
  id: string
  name: string
  category: Category
  productType: ProductType
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
  supplyId?: string
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

export interface SupplyCostHistoryEntry {
  id: string
  supplyId: string
  purchaseId?: string
  supplier: string
  previousCost: number
  newCost: number
  date: string
}

export interface BomItem {
  id: string
  productId: string
  supplyId: string
  quantity: number
}

export interface AccountingEntry {
  id: string
  type: 'ingreso' | 'egreso' | 'impuesto'
  description: string
  amount: number
  date: string
  category?: string
}
