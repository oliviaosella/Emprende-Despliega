import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { healthRouter } from './routes/health.routes'

const app = express()

app.use(
  cors({
    origin: env.corsOrigin,
  }),
)

app.use(express.json())
app.use('/api', healthRouter)

app.listen(env.port, () => {
  // Keep startup logs explicit for local development.
  console.log(`Backend listening on http://localhost:${env.port}`)
})
