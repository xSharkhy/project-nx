import e from 'express'
import { initBot } from './modules/telegram/services/telegram.service.js'
import telegramRoutes from './modules/telegram/routes.js'
import logsRoutes from './modules/logs/routes.js'

const app = e()

app.use(e.urlencoded({ limit: '5gb', extended: false }))
app.use(e.json({ limit: '5gb' }))

// Ruta principal
app.get('/', (_req, res) => {
  res.json({ message: 'Hello World!' })
})

// Rutas de Telegram
app.use('/telegram', telegramRoutes)

// Rutas de Logs
app.use('/logs', logsRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  // Inicializar el bot cuando el servidor arranca
  initBot()
})
