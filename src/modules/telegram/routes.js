import e from 'express'
import execute from '../../services/manager.service.js'

const router = e.Router()

// Ruta para enviar mensajes a través del bot de Telegram
router.get('/send-message', async (req, res) => {
  const params = ['chatId', 'message']
  await execute(req, res, 'telegram', 'sendMessage', params)
})

// Ruta de prueba para enviar mensajes a través del bot
router.get('/test', async (req, res) => {
  const params = ['chatId']
  await execute(req, res, 'telegram', 'sendTestMessage', params)
})

export default router
