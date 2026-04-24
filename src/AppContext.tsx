import React, { useState, createContext, useContext } from 'react';
import {
  Product,
  Sale,
  Purchase,
  AccountingEntry,
  SaleItem,
  PurchaseItem } from
'./types';
interface AppContextType {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  accounting: AccountingEntry[];
  addSale: (
  items: SaleItem[],
  paymentMethod: Sale['paymentMethod'],
  pedidoData?: {
    description: string;
    deadline: string;
    reminder?: string;
  })
  => void;
  completePedido: (saleId: string) => void;
  updatePedidoStatus: (saleId: string, status: Sale['pedidoStatus']) => void;
  addPurchase: (supplier: string, items: PurchaseItem[]) => void;
  addAccountingEntry: (entry: Omit<AccountingEntry, 'id' | 'date'>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
const initialProducts: Product[] = [
{
  id: 'p1',
  name: 'Cuaderno A5 Punteado',
  category: 'Cuadernos',
  costPrice: 3500,
  salePrice: 8500,
  stock: 12,
  minStock: 5,
  emoji: '📓'
},
{
  id: 'p2',
  name: 'Print Ghibli A4',
  category: 'Arte',
  costPrice: 800,
  salePrice: 3500,
  stock: 4,
  minStock: 10,
  emoji: '🖼️'
},
{
  id: 'p3',
  name: 'Stickers Holográficos',
  category: 'Papelería',
  costPrice: 200,
  salePrice: 1200,
  stock: 45,
  minStock: 20,
  emoji: '✨'
},
{
  id: 'p4',
  name: 'Washi Tape Floral',
  category: 'Papelería',
  costPrice: 900,
  salePrice: 2500,
  stock: 18,
  minStock: 10,
  emoji: '🌸'
},
{
  id: 'p5',
  name: 'Marcapáginas Acuarela',
  category: 'Accesorios',
  costPrice: 300,
  salePrice: 1500,
  stock: 30,
  minStock: 15,
  emoji: '🔖'
},
{
  id: 'p6',
  name: 'Sketchbook 200g',
  category: 'Cuadernos',
  costPrice: 4500,
  salePrice: 11000,
  stock: 8,
  minStock: 5,
  emoji: '🎨'
},
{
  id: 'p7',
  name: 'Acuarelas Pastel',
  category: 'Arte',
  costPrice: 6000,
  salePrice: 14500,
  stock: 3,
  minStock: 5,
  emoji: '🖌️'
},
{
  id: 'p8',
  name: 'Tote Bag Gatos',
  category: 'Accesorios',
  costPrice: 2500,
  salePrice: 7000,
  stock: 15,
  minStock: 5,
  emoji: '🛍️'
}];

const initialSales: Sale[] = [
{
  id: 's1',
  items: [
  {
    productId: 'p1',
    qty: 1,
    unitPrice: 8500
  },
  {
    productId: 'p3',
    qty: 2,
    unitPrice: 1200
  }],

  total: 10900,
  date: new Date(Date.now() - 86400000 * 2).toISOString(),
  paymentMethod: 'Transferencia'
},
{
  id: 's2',
  items: [
  {
    productId: 'p6',
    qty: 1,
    unitPrice: 11000
  }],

  total: 11000,
  date: new Date(Date.now() - 86400000).toISOString(),
  paymentMethod: 'Efectivo'
},
{
  id: 's3',
  items: [
  {
    productId: 'p2',
    qty: 3,
    unitPrice: 3500
  },
  {
    productId: 'p4',
    qty: 1,
    unitPrice: 2500
  }],

  total: 13000,
  date: new Date().toISOString(),
  paymentMethod: 'Tarjeta'
},
{
  id: 's4',
  items: [
  {
    productId: 'p8',
    qty: 1,
    unitPrice: 7000
  }],

  total: 7000,
  date: new Date(Date.now() - 86400000).toISOString(),
  paymentMethod: 'Transferencia',
  isPedido: true,
  pedidoDescription: 'Tote bag personalizada con nombre "Ana"',
  pedidoDeadline: new Date(Date.now() + 86400000 * 2).
  toISOString().
  split('T')[0],
  pedidoStatus: 'pendiente'
},
{
  id: 's5',
  items: [
  {
    productId: 'p1',
    qty: 2,
    unitPrice: 8500
  }],

  total: 17000,
  date: new Date(Date.now() - 86400000 * 3).toISOString(),
  paymentMethod: 'Efectivo',
  isPedido: true,
  pedidoDescription: 'Cuadernos para regalo, envolver juntos',
  pedidoDeadline: new Date(Date.now() - 86400000 * 1).
  toISOString().
  split('T')[0],
  pedidoStatus: 'en_progreso'
}];

const initialPurchases: Purchase[] = [
{
  id: 'pu1',
  supplier: 'Papelera Central',
  items: [
  {
    productId: 'p1',
    qty: 20,
    unitCost: 3500
  }],

  total: 70000,
  date: new Date(Date.now() - 86400000 * 10).toISOString()
},
{
  id: 'pu2',
  supplier: 'Imprenta Arte',
  items: [
  {
    productId: 'p2',
    qty: 50,
    unitCost: 800
  }],

  total: 40000,
  date: new Date(Date.now() - 86400000 * 5).toISOString()
}];

const initialAccounting: AccountingEntry[] = [
{
  id: 'a1',
  type: 'ingreso',
  description: 'Venta #s1',
  amount: 10900,
  date: new Date(Date.now() - 86400000 * 2).toISOString(),
  category: 'Ventas'
},
{
  id: 'a2',
  type: 'ingreso',
  description: 'Venta #s2',
  amount: 11000,
  date: new Date(Date.now() - 86400000).toISOString(),
  category: 'Ventas'
},
{
  id: 'a3',
  type: 'egreso',
  description: 'Compra Papelera Central',
  amount: 70000,
  date: new Date(Date.now() - 86400000 * 10).toISOString(),
  category: 'Insumos'
},
{
  id: 'a4',
  type: 'ingreso',
  description: 'Venta #s3',
  amount: 13000,
  date: new Date().toISOString(),
  category: 'Ventas'
},
{
  id: 'a5',
  type: 'egreso',
  description: 'Publicidad Instagram',
  amount: 5000,
  date: new Date(Date.now() - 86400000 * 3).toISOString(),
  category: 'Marketing'
}];

export const AppProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [accounting, setAccounting] =
  useState<AccountingEntry[]>(initialAccounting);
  const addSale = (
  items: SaleItem[],
  paymentMethod: Sale['paymentMethod'],
  pedidoData?: {
    description: string;
    deadline: string;
    reminder?: string;
  }) =>
  {
    const total = items.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0
    );
    const newSale: Sale = {
      id: `s${Date.now()}`,
      items,
      total,
      date: new Date().toISOString(),
      paymentMethod
    };
    if (pedidoData) {
      newSale.isPedido = true;
      newSale.pedidoDescription = pedidoData.description;
      newSale.pedidoDeadline = pedidoData.deadline;
      newSale.pedidoReminder = pedidoData.reminder;
      newSale.pedidoStatus = 'pendiente';
    }
    setSales((prev) => [newSale, ...prev]);
    // Only update stock and accounting immediately if it's NOT a pedido
    if (!pedidoData) {
      setProducts((prev) =>
      prev.map((p) => {
        const soldItem = items.find((i) => i.productId === p.id);
        if (soldItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - soldItem.qty)
          };
        }
        return p;
      })
      );
      addAccountingEntry({
        type: 'ingreso',
        description: `Venta #${newSale.id.slice(-4)}`,
        amount: total,
        category: 'Ventas'
      });
    }
  };
  const completePedido = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.pedidoStatus === 'completado') return;
    setSales((prev) =>
    prev.map((s) =>
    s.id === saleId ?
    {
      ...s,
      pedidoStatus: 'completado'
    } :
    s
    )
    );
    // Update stock when pedido is completed
    setProducts((prev) =>
    prev.map((p) => {
      const soldItem = sale.items.find((i) => i.productId === p.id);
      if (soldItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - soldItem.qty)
        };
      }
      return p;
    })
    );
    // Add to accounting when pedido is completed
    addAccountingEntry({
      type: 'ingreso',
      description: `Pedido Completado #${sale.id.slice(-4)}`,
      amount: sale.total,
      category: 'Ventas'
    });
  };
  const updatePedidoStatus = (saleId: string, status: Sale['pedidoStatus']) => {
    setSales((prev) =>
    prev.map((s) =>
    s.id === saleId ?
    {
      ...s,
      pedidoStatus: status
    } :
    s
    )
    );
  };
  const addPurchase = (supplier: string, items: PurchaseItem[]) => {
    const total = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
    const newPurchase: Purchase = {
      id: `pu${Date.now()}`,
      supplier,
      items,
      total,
      date: new Date().toISOString()
    };
    setPurchases((prev) => [newPurchase, ...prev]);
    setProducts((prev) =>
    prev.map((p) => {
      const purchasedItem = items.find((i) => i.productId === p.id);
      if (purchasedItem) {
        return {
          ...p,
          stock: p.stock + purchasedItem.qty
        };
      }
      return p;
    })
    );
    addAccountingEntry({
      type: 'egreso',
      description: `Compra a ${supplier}`,
      amount: total,
      category: 'Insumos'
    });
  };
  const addAccountingEntry = (entry: Omit<AccountingEntry, 'id' | 'date'>) => {
    const newEntry: AccountingEntry = {
      ...entry,
      id: `a${Date.now()}`,
      date: new Date().toISOString()
    };
    setAccounting((prev) => [newEntry, ...prev]);
  };
  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
    prev.map((p) =>
    p.id === productId ?
    {
      ...p,
      stock: newStock
    } :
    p
    )
    );
  };
  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        purchases,
        accounting,
        addSale,
        completePedido,
        updatePedidoStatus,
        addPurchase,
        addAccountingEntry,
        updateProductStock
      }}>
      
      {children}
    </AppContext.Provider>);

};
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};