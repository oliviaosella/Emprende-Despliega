import { useHealthCheck } from '../hooks/useHealthCheck'

const modules = [
  {
    title: 'Gestion de Clientes',
    description: 'Base para registrar clientes, historial de contacto y seguimiento comercial.',
  },
  {
    title: 'Catalogo de Productos y Servicios',
    description: 'Estructura lista para inventario, precios, paquetes y control de ofertas.',
  },
  {
    title: 'Ventas y Facturacion',
    description: 'Preparado para flujo de ventas, comprobantes y analisis de conversion.',
  },
  {
    title: 'Dashboard de Negocio',
    description: 'Panel para metricas clave: ingresos, clientes activos y tendencias.',
  },
]

export function HomePage() {
  const { status, loading, error } = useHealthCheck()

  return (
    <section className="home">
      <div className="hero">
        <p className="eyebrow">Mini sistema de gestion para emprendimientos</p>
        <h1>Gestiona tu negocio en un solo lugar</h1>
        <p className="subtitle">
          Proyecto fullstack inicial listo para crecer con modulos de clientes, catalogo,
          ventas y reportes.
        </p>

        <div className="health-card">
          <span>Estado backend:</span>
          {loading && <strong>Verificando...</strong>}
          {!loading && error && <strong className="status-error">{error}</strong>}
          {!loading && !error && (
            <strong className="status-ok">{status?.status ?? 'OK'}</strong>
          )}
        </div>
      </div>

      <div className="module-grid">
        {modules.map((module) => (
          <article key={module.title} className="module-card">
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
