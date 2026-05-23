import type { HealthModel } from '../models/health.model'

export function getHealthStatus(): HealthModel {
  return {
    status: 'OK',
    service: 'backend',
    timestamp: new Date().toISOString(),
  }
}
