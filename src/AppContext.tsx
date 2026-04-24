import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from './lib/supabase';
import {
  Product,
  Sale,
  Purchase,
  AccountingEntry,
  SaleItem,
  PurchaseItem,
  Category,
} from './types';

interface AppContextType {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  accounting: AccountingEntry[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addSale: (
    items: SaleItem[],
    paymentMethod: Sale['paymentMethod'],
    pedidoData?: { description: string; deadline: string; reminder?: string }
  ) => void;
  completePedido: (saleId: string) => void;
  updatePedidoStatus: (saleId: string, status: Sale['pedidoStatus']) => void;
  addPurchase: (supplier: string, items: PurchaseItem[]) => void;
  addAccountingEntry: (entry: Omit<AccountingEntry, 'id' | 'date'>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
}

// ─── DB row → TypeScript type mappers ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    stock: row.stock,
    minStock: row.min_stock,
    emoji: row.emoji,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(row: any): Sale {
  const sale: Sale = {
    id: row.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.sale_items ?? []).map((item: any): SaleItem => ({
      productId: item.product_id,
      qty: item.qty,
      unitPrice: item.unit_price,
    })),
    total: row.total,
    date: row.date,
    paymentMethod: row.payment_method,
  };
  if (row.is_pedido) {
    sale.isPedido = true;
    sale.pedidoDescription = row.pedido_description ?? undefined;
    sale.pedidoDeadline = row.pedido_deadline ?? undefined;
    sale.pedidoReminder = row.pedido_reminder ?? undefined;
    sale.pedidoStatus = row.pedido_status;
  }
  return sale;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPurchase(row: any): Purchase {
  return {
    id: row.id,
    supplier: row.supplier,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.purchase_items ?? []).map((item: any): PurchaseItem => ({
      productId: item.product_id,
      qty: item.qty,
      unitCost: item.unit_cost,
    })),
    total: row.total,
    date: row.date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAccountingEntry(row: any): AccountingEntry {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category ?? undefined,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounting, setAccounting] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pRes, sRes, puRes, aRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false }),
        supabase.from('purchases').select('*, purchase_items(*)').order('date', { ascending: false }),
        supabase.from('accounting_entries').select('*').order('date', { ascending: false }),
      ]);
      if (pRes.data) setProducts(pRes.data.map(mapProduct));
      if (sRes.data) setSales(sRes.data.map(mapSale));
      if (puRes.data) setPurchases(puRes.data.map(mapPurchase));
      if (aRes.data) setAccounting(aRes.data.map(mapAccountingEntry));
      setLoading(false);
    };
    void load();
  }, []);

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const id = crypto.randomUUID();
    const newProduct: Product = { ...productData, id };
    setProducts((prev) =>
      [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name))
    );
    void supabase.from('products').insert({
      id,
      name: newProduct.name,
      category: newProduct.category,
      cost_price: newProduct.costPrice,
      sale_price: newProduct.salePrice,
      stock: newProduct.stock,
      min_stock: newProduct.minStock,
      emoji: newProduct.emoji,
    });
  };

  const addSale = (
    items: SaleItem[],
    paymentMethod: Sale['paymentMethod'],
    pedidoData?: { description: string; deadline: string; reminder?: string }
  ) => {
    const id = crypto.randomUUID();
    const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const date = new Date().toISOString();

    const newSale: Sale = {
      id,
      items,
      total,
      date,
      paymentMethod,
      ...(pedidoData && {
        isPedido: true,
        pedidoDescription: pedidoData.description,
        pedidoDeadline: pedidoData.deadline,
        pedidoReminder: pedidoData.reminder,
        pedidoStatus: 'pendiente' as const,
      }),
    };

    // Calculate stock changes before async closures capture stale state
    const stockChanges: Record<string, number> = {};
    if (!pedidoData) {
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) stockChanges[item.productId] = Math.max(0, product.stock - item.qty);
      }
    }

    const accountingId = crypto.randomUUID();
    const accountingDate = new Date().toISOString();

    // Optimistic state updates
    setSales((prev) => [newSale, ...prev]);
    if (!pedidoData) {
      setProducts((prev) =>
        prev.map((p) =>
          stockChanges[p.id] !== undefined ? { ...p, stock: stockChanges[p.id] } : p
        )
      );
      setAccounting((prev) => [
        {
          id: accountingId,
          type: 'ingreso' as const,
          description: `Venta #${id.slice(-4)}`,
          amount: total,
          date: accountingDate,
          category: 'Ventas',
        },
        ...prev,
      ]);
    }

    // Background DB persist
    void (async () => {
      await supabase.from('sales').insert({
        id,
        total,
        date,
        payment_method: paymentMethod,
        is_pedido: !!pedidoData,
        pedido_description: pedidoData?.description ?? null,
        pedido_deadline: pedidoData?.deadline ?? null,
        pedido_reminder: pedidoData?.reminder ?? null,
        pedido_status: pedidoData ? 'pendiente' : null,
      });
      await supabase.from('sale_items').insert(
        items.map((item) => ({
          sale_id: id,
          product_id: item.productId,
          qty: item.qty,
          unit_price: item.unitPrice,
        }))
      );
      if (!pedidoData) {
        await Promise.all([
          ...Object.entries(stockChanges).map(([productId, newStock]) =>
            supabase.from('products').update({ stock: newStock }).eq('id', productId)
          ),
          supabase.from('accounting_entries').insert({
            id: accountingId,
            type: 'ingreso',
            description: `Venta #${id.slice(-4)}`,
            amount: total,
            date: accountingDate,
            category: 'Ventas',
          }),
        ]);
      }
    })();
  };

  const completePedido = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.pedidoStatus === 'completado') return;

    const stockChanges: Record<string, number> = {};
    for (const item of sale.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) stockChanges[item.productId] = Math.max(0, product.stock - item.qty);
    }

    const accountingId = crypto.randomUUID();
    const accountingDate = new Date().toISOString();

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, pedidoStatus: 'completado' as const } : s))
    );
    setProducts((prev) =>
      prev.map((p) =>
        stockChanges[p.id] !== undefined ? { ...p, stock: stockChanges[p.id] } : p
      )
    );
    setAccounting((prev) => [
      {
        id: accountingId,
        type: 'ingreso' as const,
        description: `Pedido Completado #${saleId.slice(-4)}`,
        amount: sale.total,
        date: accountingDate,
        category: 'Ventas',
      },
      ...prev,
    ]);

    void (async () => {
      await Promise.all([
        supabase.from('sales').update({ pedido_status: 'completado' }).eq('id', saleId),
        ...Object.entries(stockChanges).map(([productId, newStock]) =>
          supabase.from('products').update({ stock: newStock }).eq('id', productId)
        ),
        supabase.from('accounting_entries').insert({
          id: accountingId,
          type: 'ingreso',
          description: `Pedido Completado #${saleId.slice(-4)}`,
          amount: sale.total,
          date: accountingDate,
          category: 'Ventas',
        }),
      ]);
    })();
  };

  const updatePedidoStatus = (saleId: string, status: Sale['pedidoStatus']) => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, pedidoStatus: status } : s))
    );
    void supabase.from('sales').update({ pedido_status: status }).eq('id', saleId);
  };

  const addPurchase = (supplier: string, items: PurchaseItem[]) => {
    const id = crypto.randomUUID();
    const total = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
    const date = new Date().toISOString();

    const stockChanges: Record<string, number> = {};
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) stockChanges[item.productId] = product.stock + item.qty;
    }

    const accountingId = crypto.randomUUID();
    const accountingDate = new Date().toISOString();

    setPurchases((prev) => [{ id, supplier, items, total, date }, ...prev]);
    setProducts((prev) =>
      prev.map((p) =>
        stockChanges[p.id] !== undefined ? { ...p, stock: stockChanges[p.id] } : p
      )
    );
    setAccounting((prev) => [
      {
        id: accountingId,
        type: 'egreso' as const,
        description: `Compra a ${supplier}`,
        amount: total,
        date: accountingDate,
        category: 'Insumos',
      },
      ...prev,
    ]);

    void (async () => {
      await supabase.from('purchases').insert({ id, supplier, total, date });
      await Promise.all([
        supabase.from('purchase_items').insert(
          items.map((item) => ({
            purchase_id: id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost,
          }))
        ),
        ...Object.entries(stockChanges).map(([productId, newStock]) =>
          supabase.from('products').update({ stock: newStock }).eq('id', productId)
        ),
        supabase.from('accounting_entries').insert({
          id: accountingId,
          type: 'egreso',
          description: `Compra a ${supplier}`,
          amount: total,
          date: accountingDate,
          category: 'Insumos',
        }),
      ]);
    })();
  };

  const addAccountingEntry = (entry: Omit<AccountingEntry, 'id' | 'date'>) => {
    const id = crypto.randomUUID();
    const date = new Date().toISOString();
    const newEntry: AccountingEntry = { ...entry, id, date };
    setAccounting((prev) => [newEntry, ...prev]);
    void supabase.from('accounting_entries').insert({
      id,
      type: entry.type,
      description: entry.description,
      amount: entry.amount,
      date,
      category: entry.category ?? null,
    });
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    void supabase.from('products').update({ stock: newStock }).eq('id', productId);
  };

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
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
