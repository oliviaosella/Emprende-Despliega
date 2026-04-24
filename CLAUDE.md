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

### Auth & Data layer (Supabase)

Authentication is handled by Supabase Auth. `src/App.tsx` checks for a session on load and shows `src/pages/Login.tsx` (Supabase Auth UI) when unauthenticated. The Supabase client is in `src/lib/supabase.ts` and reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env.local`.

All data is persisted in Supabase PostgreSQL. The full schema with RLS policies is in `supabase/schema.sql` — run it once in Supabase SQL Editor to initialize tables.

**Tables:** `products`, `sales`, `sale_items`, `purchases`, `purchase_items`, `accounting_entries`. Every top-level table has a `user_id` column (defaulting to `auth.uid()`) and RLS that isolates data per user. Child tables (`sale_items`, `purchase_items`) inherit access through their parent via RLS subquery.

### AppContext (`src/AppContext.tsx`)

Single React Context that owns all application state. On mount it fetches all data from Supabase in parallel. All mutation functions (`addProduct`, `addSale`, `completePedido`, `updatePedidoStatus`, `addPurchase`, `addAccountingEntry`, `updateProductStock`) use **optimistic updates** — they update local state synchronously for instant UI feedback, then write to Supabase in the background.

IDs are generated in the browser with `crypto.randomUUID()` before the DB write, so the optimistic and persisted records share the same UUID.

DB columns are `snake_case`; TypeScript types are `camelCase`. Mapping happens in private functions (`mapProduct`, `mapSale`, etc.) at the top of AppContext.

**Key invariant:** Derived values (stock changes, accounting entries) are calculated **before** async closures to avoid stale closure captures.

### Routing & Pages

Routing is tab-based inside `src/App.tsx` — no URL router. `App.tsx` renders the selected page component based on `activeTab` state and wraps everything in `AppProvider`. While the context is loading data (`loading: true`), `AppContent` shows a loading screen.

**Pages** (`src/pages/`):
- `Dashboard.tsx` — KPI cards, low-stock alerts, recent sales
- `Inventory.tsx` — product list, inline stock editing, add-product modal
- `Sales.tsx` — point-of-sale cart + pedido (custom order) registration and status tracking; most complex page
- `Purchases.tsx` — supplier purchase history (read-only, no add UI yet)
- `Accounting.tsx` — financial entries and summary metrics (read-only, no add UI yet)

**Navigation:** `Sidebar.tsx` (desktop) and `BottomNav.tsx` (mobile) — purely presentational.

### Types (`src/types.ts`)

Defines all shared interfaces: `Product`, `Sale` (with optional pedido fields), `Purchase`, `AccountingEntry`, `SaleItem`, `PurchaseItem`, and the `Category` union type. Always update types here first when changing the data model.

### Styling

Tailwind utility classes throughout. Custom theme (lilac/pink palette + Inter font) is in `tailwind.config.js`. Framer Motion is used for page transitions and modal animations.

## Supabase setup (for new environments)

1. Create a project at supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key
4. Enable Email/Password auth in Authentication → Providers
