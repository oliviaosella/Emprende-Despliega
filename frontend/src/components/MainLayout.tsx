import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/productos', label: 'Productos / Servicios' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function MainLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          MiniEmprende
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
