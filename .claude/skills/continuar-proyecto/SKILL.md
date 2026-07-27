---
name: continuar-proyecto
description: Retoma el trabajo en "Mi Negocio" (repo Emprende-Despliega), la app de gestión para un emprendimiento de papelería/arte. Usar SIEMPRE al empezar una sesión nueva en este repo, o cuando el usuario pida "seguir con lo de la última vez", "continuar el proyecto", mencione insumos/productos/BOM/reventa-fabricado, o pregunte "¿dónde quedamos?". Da el contexto de arquitectura, convenciones de trabajo establecidas y el estado exacto de lo hecho/pendiente para no tener que re-derivarlo desde cero.
---

# Continuar trabajando en Mi Negocio

Esta skill es una hoja de traspaso, no un flujo de pasos a ejecutar. Léela entera antes de tocar código: te ahorra volver a explorar el repo desde cero.

## Qué es esto

"Mi Negocio" — SPA en español para gestión de un emprendimiento de papelería/arte (stock, ventas, compras, contabilidad). Monorepo:

- `frontend/` — React 19 + TypeScript + Vite + Tailwind 4. **Todo el trabajo real pasa acá.**
- `backend/` — solo un health-check stub, no maneja datos. Ignorarlo salvo que se pida explícitamente.
- `supabase/schema.sql` — foto de referencia del esquema, pero **la fuente de verdad real es el proyecto vivo de Supabase** (`project_id: kqurqiauvplkegwhipqo`, org "Despliega"). Las migraciones se aplican ahí directo vía las tools MCP de Supabase (`apply_migration`), y después se refleja el cambio en `schema.sql` para que quede legible para alguien que arranca de cero.

### Arquitectura del frontend

- `frontend/src/App.tsx` — routing por pestañas (sin router de URL), envuelve todo en `ToastProvider > ViewModeProvider > AppProvider`.
- `frontend/src/AppContext.tsx` — **el corazón del proyecto**. Único Context que posee todo el estado y todas las mutaciones (altas/bajas/modificaciones), habla directo con Supabase (no hay capa de API intermedia). Mapea `snake_case` (DB) ↔ `camelCase` (TS) con funciones `rowToX`. Cualquier feature nueva que toque datos entra por acá.
- Páginas en `frontend/src/pages/`: `Dashboard.tsx`, `Inventory.tsx` (Productos + Insumos como sub-tabs, incluye la UI de BOM), `Supplies.tsx` (panel de Insumos embebido en Inventory), `Purchases.tsx`, `Sales.tsx` (Vender / Pedidos / Historial), `Accounting.tsx`, `Profile.tsx`.
- `frontend/src/components/Toast.tsx` y `ViewModeContext.tsx` / `ViewToggle.tsx` — sistemas transversales (ver convenciones abajo).

## Convenciones de trabajo ya establecidas (no reinventar)

Estas reglas se acordaron con el usuario a lo largo de la sesión anterior. Sostenerlas a menos que el usuario diga lo contrario:

1. **Implementación incremental por pasos.** Antes de escribir código: analizar el impacto sobre lo existente, proponer los cambios de DB / "backend" (o sea AppContext) / frontend, y esperar la aprobación del usuario antes de pasar al siguiente paso. No encarar features grandes de una sola vez sin proponer primero.
2. **Migraciones de DB van directo al proyecto Supabase vivo**, usando la tool MCP `apply_migration` con `project_id: kqurqiauvplkegwhipqo` — no alcanza con escribirlas en `schema.sql` (aunque conviene mantenerlo razonablemente sincronizado después).
3. **Verificar en el navegador antes de dar algo por terminado.** Server de dev: `npm run dev` en `frontend/` (puerto 5173, `.claude/launch.json` ya tiene la config). Frecuentemente ya hay un server corriendo (a veces el usuario lo tiene abierto en paralelo probando lo mismo) — revisar antes de levantar uno nuevo. Usar las tools de Claude Browser para clickear el flujo real, no solo confiar en el typecheck.
4. **Toda operación de alta/baja/modificación (ABMC) debe disparar un toast** (`frontend/src/components/Toast.tsx`, arriba a la derecha, simple) — éxito y error. Es un requerimiento de producto transversal, no algo puntual de una sola feature. Si se agrega una mutación nueva en `AppContext.tsx`, agregarle su toast.
5. **Toggle global de vista lista/cuadrícula** (`ViewModeContext.tsx` + `ViewToggle.tsx`) aplicado en Productos, Insumos, Compras, Contabilidad y Pedidos. Lista es el default, una sola preferencia compartida en `localStorage` (no por sección). Cualquier cambio en estas secciones tiene que probarse en mobile (375px) además de desktop — ya hubo un bug real de overflow en mobile por esto, así que no asumir que "anduvo en desktop" alcanza.

## Estado del trabajo (última sesión)

Hecho, en orden:
1. Módulo de insumos: catálogo de `supply_types`, unidades de medida fijas, estado activo/inactivo.
2. Historial de costos de insumos al comprar (tabla `supply_cost_history`, `purchase_items.supply_id`).
3. `product_type` (reventa/fabricado) en productos — las compras solo actualizan `cost_price` para productos de reventa.
4. BOM (`product_bom_items`) con recálculo automático de costo para productos fabricados, en cascada cuando cambia el costo de un insumo.
5. Sistema de toasts en todas las mutaciones.
6. Toggle lista/cuadrícula global en las 5 secciones, con fixes de responsividad en mobile.

**En progreso / primer paso a retomar:** se detectó que el nombre del emprendimiento en el Dashboard ("Buenas tardes, {nombre}!") parpadeaba mostrando el placeholder por defecto "tu emprendimiento" cada vez que se volvía a la pestaña Inicio, porque `Dashboard.tsx` lo cargaba con un fetch local en cada montaje en vez de vivir en el Context (que persiste entre cambios de pestaña). Se corrigió moviendo `businessName`/`setBusinessName` a `AppContext.tsx` y sincronizando `Profile.tsx` al guardar. **Esto quedó sin re-verificar en el navegador** (la sesión se cortó a mitad de la verificación) — es lo primero para chequear al retomar: navegar entre pestañas varias veces y confirmar que ya no aparece el flash del placeholder.

## Observación pendiente, sin resolver

Durante las pruebas apareció el producto "Print Ghibli A4" con `product_type` cambiado a `fabricado` y `cost_price` en 0, sin que se identificara un camino de código que lo causara. Se le avisó al usuario que probablemente lo cambió él mismo probando la app en paralelo en otro navegador, pero nunca se confirmó ni se revirtió. Si el tema aparece o se nota algo raro en ese producto, preguntar directamente en vez de asumir.

## Dónde está cada cosa

| Necesitás... | Mirá en |
|---|---|
| Cualquier lectura/escritura de datos, toasts | `frontend/src/AppContext.tsx` |
| Productos, Insumos (tabs), BOM | `frontend/src/pages/Inventory.tsx` |
| Panel de Insumos (embebido en Inventory) | `frontend/src/pages/Supplies.tsx` |
| Compras | `frontend/src/pages/Purchases.tsx` |
| Vender / Pedidos / Historial de ventas | `frontend/src/pages/Sales.tsx` |
| Contabilidad | `frontend/src/pages/Accounting.tsx` |
| Perfil / nombre del emprendimiento | `frontend/src/pages/Profile.tsx` |
| Esquema de referencia de la DB | `supabase/schema.sql` |
| Toggle lista/cuadrícula | `frontend/src/components/ViewModeContext.tsx`, `ViewToggle.tsx` |
| Sistema de notificaciones | `frontend/src/components/Toast.tsx` |
