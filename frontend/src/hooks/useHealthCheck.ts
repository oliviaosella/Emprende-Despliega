import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'
import type { HealthResponse } from '../types/health'

export function useHealthCheck() {
  const [status, setStatus] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await getHealth()
        setStatus(response)
      } catch {
        setError('No disponible')
      } finally {
        setLoading(false)
      }
    }

    void loadHealth()
  }, [])

  return { status, loading, error }
}
