import type { HealthResponse } from '../types/health'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('Health check failed')
  }

  return (await response.json()) as HealthResponse
}
