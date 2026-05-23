interface ComingSoonPageProps {
  title: string
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <section className="coming-soon">
      <h1>{title}</h1>
      <p>
        Este modulo queda preparado para la siguiente fase de implementacion de negocio.
      </p>
    </section>
  )
}
