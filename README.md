# Mi Negocio

Aplicacion web para gestionar un pequeno emprendimiento de papeleria, arte o productos personalizados. Permite administrar inventario, insumos, compras, ventas, pedidos, contabilidad y perfil del negocio desde una interfaz simple en espanol.

## Funcionalidades

- Dashboard con metricas, alertas de bajo stock y ventas recientes.
- Inventario de productos con categorias, stock minimo, precios y emojis.
- Productos de reventa y productos fabricados.
- Gestion de insumos, tipos de insumo y unidades de medida.
- BOM / recetas de fabricacion para calcular costos de productos fabricados.
- Punto de venta con carrito, metodos de pago y registro de pedidos personalizados.
- Seguimiento de pedidos por estado: pendiente, en progreso y completado.
- Registro de compras a proveedores, productos e insumos.
- Historial de costos de insumos.
- Contabilidad de ingresos, egresos e impuestos.
- Perfil de usuario y negocio con autenticacion de Supabase.
- Notificaciones de exito y error para operaciones principales.
- Vista lista/cuadricula compartida en secciones clave.

## Stack

### Frontend

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Supabase Auth y Supabase PostgreSQL

### Backend

El directorio `backend/` contiene una API Node.js/Express en TypeScript con un endpoint de health check. La app principal actualmente persiste datos directamente en Supabase desde el frontend.

### Base de datos

El esquema de referencia esta en `supabase/schema.sql`. Incluye tablas principales, relaciones y politicas RLS para aislar los datos por usuario.

## Estructura

```text
.
├── frontend/              # App React principal
│   ├── src/
│   │   ├── components/    # Navegacion, toasts, controles reutilizables
│   │   ├── lib/           # Cliente Supabase
│   │   ├── pages/         # Dashboard, Inventario, Ventas, Compras, etc.
│   │   ├── App.tsx
│   │   ├── AppContext.tsx # Estado global y mutaciones contra Supabase
│   │   └── types.ts
│   └── package.json
├── backend/               # API Express secundaria / health check
├── supabase/
│   └── schema.sql         # Esquema inicial de referencia
└── README.md
```

## Requisitos

- Node.js 20 o superior recomendado
- npm
- Proyecto de Supabase

## Configuracion

### 1. Instalar dependencias

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase.
3. Activar Email/Password en Authentication -> Providers.
4. Crear al menos un usuario en Authentication -> Users.

> Nota: si se agregaron migraciones nuevas durante el desarrollo, verificar que `supabase/schema.sql` este sincronizado con la base viva antes de preparar un entorno nuevo.

### 3. Variables de entorno

Copiar los ejemplos y completar los valores locales:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

`frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_API_BASE_URL=/api
```

`backend/.env`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Los archivos `.env`, `.env.local` y variantes de produccion estan ignorados por Git. No subir credenciales reales al repositorio.

## Desarrollo

Frontend:

```bash
cd frontend
npm run dev
```

Disponible en `http://localhost:5173`.

Backend opcional:

```bash
cd backend
npm run dev
```

Disponible en `http://localhost:4000`.

## Build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm run build
```

## Scripts

### Frontend

- `npm run dev`: servidor de desarrollo.
- `npm run build`: typecheck y bundle de produccion.
- `npm run preview`: previsualizacion local del build.
- `npm run start`: alias de preview.

### Backend

- `npm run dev`: servidor de desarrollo con recarga.
- `npm run build`: compila TypeScript.
- `npm run start`: ejecuta el build compilado.
