-- Mi Negocio — Database Schema
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Products
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name         text not null,
  category     text not null,
  cost_price   integer not null,
  sale_price   integer not null,
  stock        integer not null default 0,
  min_stock    integer not null default 5,
  emoji        text not null default '📦',
  created_at   timestamptz default now()
);

-- Sales
create table if not exists sales (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade default auth.uid(),
  total               integer not null,
  date                timestamptz not null default now(),
  payment_method      text not null,
  is_pedido           boolean default false,
  pedido_description  text,
  pedido_deadline     date,
  pedido_reminder     date,
  pedido_status       text,
  created_at          timestamptz default now()
);

-- Sale items (child of sales — no own user_id, RLS goes through parent)
create table if not exists sale_items (
  id          bigint generated always as identity primary key,
  sale_id     uuid not null references sales(id) on delete cascade,
  product_id  uuid not null references products(id),
  qty         integer not null,
  unit_price  integer not null
);

-- Purchases
create table if not exists purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  supplier    text not null,
  total       integer not null,
  date        timestamptz not null default now(),
  created_at  timestamptz default now()
);

-- Purchase items (child of purchases — no own user_id)
create table if not exists purchase_items (
  id           bigint generated always as identity primary key,
  purchase_id  uuid not null references purchases(id) on delete cascade,
  product_id   uuid not null references products(id),
  qty          integer not null,
  unit_cost    integer not null
);

-- Accounting entries
create table if not exists accounting_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type         text not null check (type in ('ingreso', 'egreso', 'impuesto')),
  description  text not null,
  amount       integer not null,
  date         timestamptz not null default now(),
  category     text,
  created_at   timestamptz default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────────

alter table products          enable row level security;
alter table sales             enable row level security;
alter table sale_items        enable row level security;
alter table purchases         enable row level security;
alter table purchase_items    enable row level security;
alter table accounting_entries enable row level security;

-- Each user can only see and modify their own top-level records
create policy "own_products" on products for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_sales" on sales for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_purchases" on purchases for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_accounting_entries" on accounting_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables: access is granted when the parent belongs to the current user
create policy "own_sale_items" on sale_items for all
  using (
    exists (select 1 from sales where sales.id = sale_items.sale_id and sales.user_id = auth.uid())
  )
  with check (
    exists (select 1 from sales where sales.id = sale_items.sale_id and sales.user_id = auth.uid())
  );

create policy "own_purchase_items" on purchase_items for all
  using (
    exists (select 1 from purchases where purchases.id = purchase_items.purchase_id and purchases.user_id = auth.uid())
  )
  with check (
    exists (select 1 from purchases where purchases.id = purchase_items.purchase_id and purchases.user_id = auth.uid())
  );

-- Supply types (tipos de insumo — catálogo configurable por usuario)
create table if not exists supply_types (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name         text not null,
  created_at   timestamptz default now(),
  unique (user_id, name)
);

alter table supply_types enable row level security;

create policy "own_supply_types" on supply_types for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Supplies (insumos para compras — no manejan stock, solo costo vigente)
create table if not exists supplies (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name            text not null,
  supply_type_id  uuid not null references supply_types(id),
  unit            text not null default 'Unidad'
                    check (unit in ('Unidad','Hoja','Litro','ml','Kg','g','Metro','cm')),
  unit_cost       integer not null,
  active          boolean not null default true,
  emoji           text not null default '📋',
  created_at      timestamptz default now()
);

alter table supplies enable row level security;

create policy "own_supplies" on supplies for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: supply_type_id has no ON DELETE CASCADE — Postgres blocks deleting
-- a supply_type while supplies still reference it (enforces "no borrar tipo en uso").
