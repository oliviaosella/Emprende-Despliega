# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

Monorepo with two active packages:

```
frontend/   ← React app (edit ALL frontend code here)
backend/    ← Node.js/TypeScript API (port 4000)
supabase/   ← DB schema (schema.sql)
```

**Never edit the root `src/` — it doesn't exist anymore. All frontend work goes in `frontend/src/`.**

## Commands

Run all commands from the `frontend/` directory:

```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Start Vite dev server on :5173 (hot reload)
npm run build      # tsc + Vite production bundle
npm run preview    # Serve the production build locally
```

## Frontend architecture (`frontend/src/`)

React 19 + TypeScript SPA ("Mi Negocio") — Spanish-language business management dashboard for a small stationery/art-supplies shop. Built with Vite 8, Tailwind CSS 4, Framer Motion, and Lucide React icons.

### Auth & Data layer (Supabase)

Authentication is handled by Supabase Auth. `frontend/src/App.tsx` checks for a session on load and shows `frontend/src/pages/Login.tsx` when unauthenticated. The Supabase client is in `frontend/src/lib/supabase.ts` and reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `frontend/.env.local`.

All data is persisted in Supabase PostgreSQL. The full schema with RLS policies is in `supabase/schema.sql` — run it once in Supabase SQL Editor to initialize tables.

**Tables:** `products`, `sales`, `sale_items`, `purchases`, `purchase_items`, `accounting_entries`. Every top-level table has a `user_id` column (defaulting to `auth.uid()`) and RLS that isolates data per user. Child tables (`sale_items`, `purchase_items`) inherit access through their parent via RLS subquery.

### AppContext (`frontend/src/AppContext.tsx`)

Single React Context that owns all application state. On mount it fetches all data from Supabase in parallel. All mutation functions (`addProduct`, `addSale`, `completePedido`, `updatePedidoStatus`, `addPurchase`, `addAccountingEntry`, `updateProductStock`) use **optimistic updates** — they update local state synchronously for instant UI feedback, then write to Supabase in the background.

IDs are generated in the browser with `crypto.randomUUID()` before the DB write, so the optimistic and persisted records share the same UUID.

DB columns are `snake_case`; TypeScript types are `camelCase`. Mapping happens in private functions (`rowToProduct`, `rowToSale`, etc.) at the top of AppContext.

**Key invariant:** Derived values (stock changes, accounting entries) are calculated **before** async closures to avoid stale closure captures.

### Routing & Pages

Routing is tab-based inside `frontend/src/App.tsx` — no URL router. `App.tsx` renders the selected page component based on `activeTab` state and wraps everything in `AppProvider`. TabType is defined in `frontend/src/components/BottomNav.tsx`.

**Pages** (`frontend/src/pages/`):
- `Login.tsx` — custom email/password form, shown when unauthenticated
- `Dashboard.tsx` — KPI cards, low-stock alerts, recent sales
- `Inventory.tsx` — product list, inline stock editing, add-product modal
- `Sales.tsx` — point-of-sale cart + pedido (custom order) registration and status tracking; most complex page
- `Purchases.tsx` — supplier purchase history
- `Accounting.tsx` — financial entries and summary metrics
- `Profile.tsx` — user profile (nombre, empresa, teléfono via user_metadata), change password, logout

**Navigation:** `Sidebar.tsx` (desktop, includes Mi Perfil) and `BottomNav.tsx` (mobile, 5 tabs). Mobile also has a fixed top header with user icon → profile.

### Types (`frontend/src/types.ts`)

Defines all shared interfaces: `Product`, `Sale` (with optional pedido fields), `Purchase`, `AccountingEntry`, `SaleItem`, `PurchaseItem`, and the `Category` union type. Always update types here first when changing the data model.

### Styling

Tailwind 4 utility classes throughout. Custom theme (lilac/pink palette) is in `frontend/tailwind.config.js`. Framer Motion is used for page transitions and modal animations.

## Supabase setup (for new environments)

1. Create a project at supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy `frontend/.env.example` to `frontend/.env.local` and fill in the project URL and anon key
4. Enable Email/Password auth in Authentication → Providers
5. Create the first user in Supabase dashboard → Authentication → Users → Add user
