# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (hot reload)
npm run build      # TypeScript compile + production bundle
npm run lint       # ESLint across .js/.jsx/.ts/.tsx
npm run preview    # Serve the production build locally
```

There are no test scripts configured.

## Architecture

React 18 + TypeScript SPA ("Mi Negocio") — a Spanish-language business management dashboard for a small stationery/art-supplies shop. Built with Vite, Tailwind CSS, Framer Motion, and Lucide React icons.

**State** lives entirely in `src/AppContext.tsx` — a single React Context (`AppProvider`) that holds four top-level collections (`products`, `sales`, `purchases`, `accountingEntries`) and exposes CRUD functions for each. Every page reads and writes through the `useAppContext()` hook; there is no external data store or persistence layer (data resets on refresh).

**Routing** is tab-based inside `src/App.tsx` — no URL router. `App.tsx` renders the selected page component based on an `activeTab` state value and wraps everything in `AppProvider`.

**Pages** (`src/pages/`) are the main feature surfaces:
- `Dashboard.tsx` — KPI cards, low-stock alerts, recent sales
- `Inventory.tsx` — product CRUD and stock management
- `Sales.tsx` — point-of-sale cart UI plus "pedido" (custom order) registration and status tracking; the most complex page (~650 lines)
- `Purchases.tsx` — supplier purchase history
- `Accounting.tsx` — financial entries and summary metrics

**Navigation components** (`src/components/`) are purely presentational: `Sidebar.tsx` for desktop, `BottomNav.tsx` for mobile.

**Types** (`src/types.ts`) define all shared interfaces (`Product`, `Sale`, `Purchase`, `AccountingEntry`, etc.) — always update types here first when changing the data model.

**Styling** uses Tailwind utility classes throughout. Custom theme (lilac/pink palette + Inter font) is in `tailwind.config.js`. Framer Motion is used for page transition animations.
