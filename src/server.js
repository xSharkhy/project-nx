import e from 'express'
import { Bot } from 'grammy'

const app = e()

app.use(e.urlencoded({ limit: '5gb', extended: false }))
app.use(e.json({ limit: '5gb' }))

app.get('/', (_req, res) => {
  res.json({ message: 'Hello World!' })
})

const bot = new Bot(process.env.TELEGRAM_TOKEN)
bot.on('message', (ctx) => {
  ctx.reply('Hello!')
})

app.get('/test', async (req, res) => {
  const chatId = req.query.chatId
  if (!chatId) {
    return res.status(400).json({ error: 'chatId is required' })
  }

  try {
    await bot.api.sendMessage(chatId, 'Hello from the server!')
    res.json({ message: 'Message sent!' })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

bot.start()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
