import e from 'express'
import execute from '../services/manager.service'

const router = e.Router()

router.get('/sendMessage', async (req, res) => {
  const params = ['chatId', 'message']
  await execute(req, res, 'telegram', 'sendMessage', params)
})
