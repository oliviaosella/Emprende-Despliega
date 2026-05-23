# MiniEmprende

Proyecto fullstack moderno para un **mini sistema de gestion de emprendimientos**. 

Sistema completo con inventario, ventas con soporte de pedidos personalizados, compras, contabilidad y dashboard en tiempo real.

## Stack

### Frontend

- **Vite** (bundler ultra rápido)
- **React 19** + TypeScript
- **Tailwind CSS v4** (estilos)
- **Framer Motion** (animaciones suaves)
- **Lucide React** (iconografía)
- Estructura modular escalable

### Backend

- **Node.js** + Express + TypeScript
- Variables de entorno con dotenv
- Soporte CORS para desarrollo/producción
- Estructura de capas (controllers, services, routes, models)

## Características ✨

### 📊 Dashboard
- Métricas en tiempo real: Ventas hoy, Ingresos mensuales, Valor inventario
- Alertas de productos con bajo stock
- Historial de últimas ventas
- Saludo personalizado por hora

### 📦 Gestión de Inventario
- Búsqueda y filtro por categoría
- Edición inline de stock
- Indicadores de stock bajo
- Emojis personalizados por producto

### 🛒 Ventas
- Sistema de carrito interactivo
- Métodos de pago: Efectivo, Transferencia, Tarjeta
- **Sistema de Pedidos Personalizados**:
  - Descripción personalizada
  - Fecha de entrega
  - Recordatorio automático
  - Estados: Pendiente → En Progreso → Completado
  - Countdown de entregas con alertas

### 📥 Compras
- Registro de compras a proveedores
- Actualización automática de stock
- Historial de transacciones

### 📊 Contabilidad
- Tracking de ingresos y egresos
- Balance general
- Filtros por tipo de transacción
## 🚀 Instalación & Ejecución

### Requisitos
- Node.js 16+
- npm o yarn

### Setup Inicial

```bash
# 1. Instalar dependencias del frontend
cd frontend
npm install

# 2. Instalar dependencias del backend
cd ../backend
npm install
```

### Desarrollo

**Terminal 1 - Frontend (http://localhost:5173)**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend (http://localhost:4000)**
```bash
cd backend
npm run dev
```

El frontend está configurado con proxy para consumir el backend automáticamente.

### Build Producción

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

## 📁 Estructura de Carpetas

```
MiniEmprende/
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, BottomNav
│   │   ├── pages/             # Dashboard, Inventory, Sales, Purchases, Accounting
│   │   ├── App.tsx            # Layout principal
│   │   ├── AppContext.tsx      # State management & lógica de negocio
│   │   ├── types.ts           # Definiciones TypeScript
│   │   └── main.tsx
│   ├── public/
│   ├── vite.config.ts         # Configuración Vite + Proxy
│   ├── tailwind.config.js     # Tema personalizado
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   ├── services/
    │   ├── config/
    │   └── index.ts           # Punto de entrada
    ├── dist/                  # Build compilado
    └── package.json
```

## 🎨 Personalización

### Temas
- **Colores**: Editar en `frontend/tailwind.config.js`
- **Tipografía**: Google Fonts (Inter) en `src/index.css`
- **Iconos**: Lucide React (cambia en componentes)

### Agregar Productos Iniciales
Editar mock data en `frontend/src/AppContext.tsx` (línea ~40)

## 🔌 API Integration

El backend tiene proxy configurado en Vite:
- URLs `/api/*` redirigen automáticamente a `http://localhost:4000`
- Listo para conectar servicios reales

## Variables de entorno

### Frontend

Archivo: `frontend/.env`

```env
VITE_API_BASE_URL=/api
```

### Backend

Archivo: `backend/.env`

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Tambien puedes copiar desde `frontend/.env.example` y `backend/.env.example`.

## Endpoints iniciales

- `GET /api/health`

Respuesta esperada:

```json
{
  "status": "OK",
  "service": "backend",
  "timestamp": "2026-04-23T00:00:00.000Z"
}
```

## Como correr el proyecto

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Servidor disponible en `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicacion disponible en `http://localhost:5173`.

## Scripts

### Frontend

- `npm run dev`: desarrollo
- `npm run build`: build de produccion
- `npm run start`: previsualizacion del build

### Backend

- `npm run dev`: desarrollo con recarga
- `npm run build`: compilar TypeScript a `dist`
- `npm run start`: ejecutar build compilado

## Escalabilidad prevista

La base del proyecto queda preparada para agregar:

- Gestion de clientes
- Productos o servicios
- Ventas
- Dashboard con metricas

Cada modulo puede crecer con su propio dominio (controladores, servicios, modelos y rutas) sin romper la estructura inicial.
