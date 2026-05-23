import dotenv from 'dotenv'

dotenv.config()

const port = Number(process.env.PORT ?? 4000)

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number')
}

export const env = {
  port,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
}
