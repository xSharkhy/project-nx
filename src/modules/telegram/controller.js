import telegramBot from './entities/bot.entity.js'

/**
 * Inicializa el bot de Telegram con el token de las variables de entorno
 * @returns {Boolean} - Indica si la inicialización fue exitosa
 */
export function initBot () {
  const token = process.env.TELEGRAM_TOKEN
  if (!token) {
    console.error(
      'TELEGRAM_TOKEN no está configurado en las variables de entorno'
    )
    return false
  }

  const initialized = telegramBot.initialize(token)
  if (initialized) {
    const bot = telegramBot.getInstance()

    // Configuración básica del bot
    bot.on('message', ctx => {
      ctx.reply('Hello!')
    })

    // Iniciar el bot
    bot.start()
    console.log('Bot de Telegram inicializado correctamente')
    return true
  }

  return false
}

/**
 * Envía un mensaje de prueba a través del bot de Telegram
 * @param {String} chatId - ID del chat al que se enviará el mensaje
 * @returns {Object} - Resultado de la operación
 */
export async function sendTestMessage (chatId) {
  if (!chatId) {
    return { statusCode: 400, body: { error: 'chatId is required' } }
  }

  if (!telegramBot.isInitialized()) {
    return { statusCode: 500, body: { error: 'Bot no inicializado' } }
  }

  try {
    await telegramBot
      .getInstance()
      .api.sendMessage(chatId, 'Hello from the server!')
    return { statusCode: 200, body: { message: 'Message sent!' } }
  } catch (error) {
    console.error('Error sending message:', error)
    return { statusCode: 500, body: { error: 'Failed to send message' } }
  }
}

/**
 * Envía un mensaje personalizado a través del bot de Telegram
 * @param {String} chatId - ID del chat al que se enviará el mensaje
 * @param {String} message - Mensaje a enviar
 * @returns {Object} - Resultado de la operación
 */
export async function sendMessage (chatId, message) {
  if (!chatId || !message) {
    return {
      statusCode: 400,
      body: { error: 'chatId and message are required' }
    }
  }

  if (!telegramBot.isInitialized()) {
    return { statusCode: 500, body: { error: 'Bot no inicializado' } }
  }

  try {
    await telegramBot.getInstance().api.sendMessage(chatId, message)
    return { statusCode: 200, body: { message: 'Message sent!' } }
  } catch (error) {
    console.error('Error sending message:', error)
    return { statusCode: 500, body: { error: 'Failed to send message' } }
  }
}
