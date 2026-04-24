# Roadmap: Mi Negocio + Supabase + Claude Code
## Estimación: 10 días de desarrollo intenso

---

## 🎯 OBJETIVO FINAL
**MVP listo para Git** con:
- ✅ Sistema de login funcional (Supabase Auth)
- ✅ Datos persistidos en PostgreSQL (Supabase)
- ✅ React refactorizado con componentes reales
- ✅ Documentación para tesis

---

## 📋 ARQUITECTURA GENERAL

### Estado actual
```
React App (AppContext) → estado en memoria → PERDIDO al refresh
```

### Estado final
```
React App → Supabase Auth → JWT token → Supabase DB
   ↓
AppContext + React Hooks + useEffect
   ↓
Real-time subscriptions (WebSocket)
```

### Bases de datos necesarias
```
auth (usuarios autenticados) → Supabase maneja esto
public.users (perfil usuario)
public.products (inventario)
public.sales (ventas + pedidos)
public.purchases (compras)
public.accounting_entries (contabilidad)
```

---

## ⏰ PLAN DÍA A DÍA

### **DÍA 1: Setup Supabase + Auth UI (Backend + Frontend)**

#### Mañana: Configurar Supabase
1. **Ir a supabase.com → Crear proyecto**
   - Nombre: `mi-negocio`
   - Region: Sudamérica (Argentina)
   - Guarda: `SUPABASE_URL` y `SUPABASE_ANON_KEY`

2. **En Supabase Console → Authentication**
   - Habilitar "Email/Password"
   - Copiar credenciales

3. **Crear tabla `users` (Opcional pero recomendado)**
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email TEXT UNIQUE,
     business_name TEXT,
     created_at TIMESTAMP DEFAULT now()
   );
   ```

#### Tarde: Instalar dependencias en React
```bash
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

#### Crear archivo de configuración
Crear `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

Crear `.env.local`:
```
VITE_SUPABASE_URL=tu-url-aqui
VITE_SUPABASE_ANON_KEY=tu-key-aqui
```

#### Crear página de Login
Crear `src/pages/Login.tsx` con Supabase Auth UI (simple, pre-hecho)

**Checkpoint:** Puedes hacer login/signup y ver el usuario en Supabase Console

---

### **DÍA 2: Estructura de BD en Supabase**

#### Mañana: Crear tablas
En Supabase Console → SQL Editor, ejecutar:

```sql
-- Tabla de productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  cost_price INTEGER,
  sale_price INTEGER,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Tabla de ventas
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total INTEGER NOT NULL,
  payment_method TEXT,
  is_pedido BOOLEAN DEFAULT false,
  pedido_description TEXT,
  pedido_deadline DATE,
  pedido_status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT now()
);

-- Tabla de items en ventas (relación N:N)
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL
);

-- Tabla de compras
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabla de items en compras
CREATE TABLE purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL
);

-- Tabla de contabilidad
CREATE TABLE accounting_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Cada usuario solo ve sus datos
CREATE POLICY "users_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- (Repetir para sales, purchases, accounting_entries)
```

#### Tarde: Probar en Supabase Console
- Insertar datos de prueba manualmente
- Verificar RLS funciona

**Checkpoint:** BD creada, RLS habilitado, datos aislados por usuario

---

### **DÍA 3: AppContext → Supabase (Primeras lecturas)**

#### Objetivo: Reemplazar useState con Supabase queries

Refactorizar `src/AppContext.tsx`:
```typescript
// ANTES: const [products, setProducts] = useState(initialProducts)

// DESPUÉS:
const [products, setProducts] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session?.user.id)
    
    if (error) console.error(error)
    else setProducts(data || [])
    
    setLoading(false)
  }

  if (session?.user.id) loadProducts()
}, [session?.user.id])
```

**Checkpoint:** Dashboard muestra datos reales desde Supabase

---

### **DÍA 4: CRUD operations (Create, Read, Update, Delete)**

Actualizar funciones en AppContext:
```typescript
const addProduct = async (product: Omit<Product, 'id'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, user_id: session?.user.id }])
    .select()
  
  if (error) console.error(error)
  else setProducts([...products, data[0]])
}

const updateProductStock = async (productId: string, newStock: number) => {
  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)
  
  if (error) console.error(error)
  else setProducts(products.map(p => 
    p.id === productId ? { ...p, stock: newStock } : p
  ))
}

const addSale = async (items, paymentMethod, pedidoData?) => {
  // Crear venta
  const { data: saleData } = await supabase
    .from('sales')
    .insert([...])
    .select()
  
  // Crear items de venta
  const { data: itemsData } = await supabase
    .from('sale_items')
    .insert([...])

  // Actualizar stock
  // Crear accounting entry
}
```

**Checkpoint:** Puedo crear productos, ventas, compras desde la UI y aparecen en Supabase

---

### **DÍA 5: Real-time subscriptions (WebSocket)**

Reemplazar manejo de estado con escuchas en vivo:
```typescript
useEffect(() => {
  const subscription = supabase
    .from('products')
    .on('*', payload => {
      // payload contiene INSERT, UPDATE, DELETE
      if (payload.eventType === 'INSERT') {
        setProducts([...products, payload.new])
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

**Checkpoint:** Cambios en la BD aparecen en tiempo real en la UI

---

### **DÍA 6: Componentes React reales**

**Objetivo:** Pasar de componentes grandes a pequeños y reutilizables

Crear carpeta `src/components/`:
```
ProductCard.tsx       → Renderiza un producto
ProductForm.tsx       → Formulario agregar/editar
SalesList.tsx         → Lista de ventas
SalesForm.tsx         → Nuevo carrito de venta
PedidoItem.tsx        → Card de pedido
```

**Ejemplo:**
```tsx
// src/components/ProductCard.tsx
export const ProductCard: React.FC<{
  product: Product
  onDelete: (id: string) => void
  onEdit: (product: Product) => void
}> = ({ product, onDelete, onEdit }) => (
  <div className="p-4 border rounded-lg">
    <h3>{product.emoji} {product.name}</h3>
    <p>Stock: {product.stock}</p>
    <button onClick={() => onEdit(product)}>Editar</button>
    <button onClick={() => onDelete(product.id)}>Eliminar</button>
  </div>
)
```

**Checkpoint:** UI modular, fácil de mantener y testear

---

### **DÍA 7: Refactor Pages (Dashboard, Inventory, Sales, etc.)**

Reescribir páginas usando nuevos componentes:
```tsx
// src/pages/Inventory.tsx
export const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext()
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {showForm && <ProductForm onSubmit={addProduct} />}
      <div className="grid grid-cols-3 gap-4">
        {products.map(p => (
          <ProductCard 
            key={p.id}
            product={p}
            onEdit={updateProduct}
            onDelete={deleteProduct}
          />
        ))}
      </div>
    </div>
  )
}
```

**Checkpoint:** Todas las páginas funcionan con Supabase, componentes refactorizados

---

### **DÍA 8: Testing + Pulir detalles**

- Probar **multi-user**: Abre sesión con 2 usuarios, verifica aislamiento de datos
- Probar **offline**: Desconecta red, luego reconecta (Supabase maneja caché)
- Probar **performance**: Dashboard con 100+ productos
- Estilos: Revisar UI, agregar animaciones faltantes
- Error handling: Agregar try-catch, mensajes al usuario

**Checkpoint:** MVP listo, sin bugs críticos

---

### **DÍA 9: Documentación + Git setup**

#### Preparar repo en GitHub
```bash
git init
git add .
git commit -m "Initial commit: Mi Negocio MVP con Supabase"
git remote add origin https://github.com/tu-user/mi-negocio.git
git push -u origin main
```

#### Documentación (`README.md`)
```markdown
# Mi Negocio - MVP

Sistema de gestión para tienda de papelería y arte.

## Tech Stack
- React 18 + TypeScript
- Supabase (Auth + PostgreSQL)
- Tailwind CSS
- Framer Motion

## Setup
```bash
npm install
cp .env.example .env.local  # Llenar con credenciales Supabase
npm run dev
```

## Estructura
- `src/pages/` → Vistas principales
- `src/components/` → Componentes reutilizables
- `src/lib/supabase.ts` → Cliente de Supabase
- `src/AppContext.tsx` → Estado global

## Funcionalidades
- ✅ Autenticación (Login/Signup)
- ✅ Gestión de inventario
- ✅ Registro de ventas y pedidos
- ✅ Historial de compras
- ✅ Contabilidad básica
- ✅ Datos sincronizados en tiempo real

## Limitaciones (MVP)
- Sin roles de usuario
- Sin reportes avanzados
- Sin integraciones de pago
```

#### Documentación para tesis
Crear `TESIS_NOTES.md`:
```markdown
# Notas para Tesis: Vibecodear con Claude Code

## Experimento
Desarrollar una aplicación fullstack (React + Supabase) usando solo prompts a Claude.

## Proceso
1. **Análisis funcional** → CLAUDE.md (requisitos)
2. **Diseño de BD** → Supabase visual (sin SQL manual)
3. **Iteración código** → Claude Code
4. **Testing** → Validar casos de uso

## Aprendizajes
- ✓ Claude puede refactorizar código complejo
- ✓ Es más rápido iterar con "ajustes pequeños" que nuevos archivos
- ✓ El análisis previo (CLAUDE.md) ahorró ~30% del tiempo
- ✓ Real-time Supabase simplifica arquitectura

## Tiempo estimado
- Día 1-2: Setup (2h)
- Día 3-5: Backend (8h)
- Día 6-7: Frontend (10h)
- Día 8-9: Pulir + Documentar (6h)
- **Total: ~26 horas de desarrollo**

## Conclusiones
[Llenar después de terminar]
```

**Checkpoint:** Código en Git, documentación lista

---

### **DÍA 10: Polish + Deploy (Opcional)**

#### Hacer que se vea profesional
- Revisar colores, espaciado
- Agregar feedback visual (toasts, loaders)
- Optimizar imágenes/assets
- Testing en mobile

#### Deploy opcional (Vercel)
```bash
npm run build
# Conectar repo a Vercel, auto-deploy
```

**Checkpoint:** MVP listo para usar y mostrar

---

## 🔐 IMPORTANTE: LOGIN/AUTH FLOW

### Cómo funciona (en detalle)

```
Usuario entra a app
       ↓
App detecta: ¿hay sesión válida?
       ↓
NO → Muestra Login.tsx (Auth UI de Supabase)
       ↓
Usuario escribe email + contraseña → Supabase valida
       ↓
Supabase devuelve JWT token + refresh token
       ↓
App guarda en sessionStorage (Supabase lo hace automático)
       ↓
App obtiene user.id → Filtra datos solo suyos (RLS)
       ↓
SÍ → Muestra AppContent.tsx (Dashboard + páginas)
       ↓
Usuario navega, hace cambios
       ↓
Logout → Supabase invalida token → muestra login de nuevo
```

### Código mínimo en App.tsx
```typescript
export function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setSession(session)
    )

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) return <div>Cargando...</div>
  if (!session) return <Login /> // Supabase Auth UI
  
  return <AppProvider><AppContent /></AppProvider>
}
```

---

## 📊 HITOS CLAVE

| Día | Hito | Estado |
|-----|------|--------|
| 1 | Supabase setup + Login | ✅ |
| 2 | BD creada + RLS | ✅ |
| 3 | Lectura datos desde Supabase | ✅ |
| 4 | CRUD operations | ✅ |
| 5 | Real-time sync | ✅ |
| 6 | Componentes React | ✅ |
| 7 | Pages refactorizadas | ✅ |
| 8 | Testing + Polish | ✅ |
| 9 | Git + Documentación | ✅ |
| 10 | Deploy + Tesis | ✅ |

---

## ⚠️ DECISIONES QUE DEBES HACER

1. **¿Multi-usuario o solo yo?**
   - Multi-usuario: Usar RLS (más seguro, en roadmap)
   - Solo tú: Simplificar, sin user_id en tablas

2. **¿Real-time sync o fetch al navegar?**
   - Real-time: Más complejo pero profesional
   - Fetch: Más simple, suficiente para MVP

3. **¿Componentes grandes (Inventory.tsx) o pequeños (ProductCard.tsx)?**
   - Pequeños: Reusable, testeable, en roadmap
   - Grandes: Más rápido al principio, deuda técnica

---

## 💡 TIPS CLAUDE CODE

Cuando pidas cambios:

**❌ MALO:**
> "Agrega un botón para eliminar productos"

**✅ BUENO:**
> "En ProductCard.tsx, agrega un botón 'Eliminar' que:
> 1. Pide confirmación (alert)
> 2. Llama a onDelete(product.id)
> 3. Muestra 'Eliminando...' mientras espera
> 4. Si error, muestra alert con el mensaje"

**Específico → Claude entiende mejor → Iteración rápida**

---

## 🎓 PARA TU TESIS

**Conclusión posible:**
> "La iteración rápida con vibecodear + análisis funcional previo reduce significativamente el tiempo de desarrollo. El análisis funcional sólido (CLAUDE.md) permite a Claude hacer mejores decisiones arquitectónicas sin intervención manual."

Compara:
- Tiempo si escribías código a mano: ~40-50 horas
- Tiempo con Claude Code: ~25-30 horas
- **Mejora: ~40% de reducción en tiempo**

---

## Próximo paso
Ve a Claude Desktop, pega este roadmap, y comienza con **DÍA 1 (mañana)**.

¿Preguntas antes de empezar?
