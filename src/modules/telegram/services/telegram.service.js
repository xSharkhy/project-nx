import telegramBot from '../entities/bot.entity.js'
import {
  setupMessageListener,
  setupStartCommandListener,
  setupHelpCommandListener,
  setupPingCommandListener,
  setupMediaListener
} from '../utils/bot-listeners.utils.js'

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

    // Configurar los listeners del bot
    setupStartCommandListener(bot)
    setupHelpCommandListener(bot)
    setupPingCommandListener(bot)
    setupMediaListener(bot)
    setupMessageListener(bot)

    // Iniciar el bot
    bot.start()
    console.log('Bot de Telegram inicializado correctamente')
    return true
  }

  return false
}

/**
 * Envía un mensaje a través del bot de Telegram
 * @param {String} chatId - ID del chat al que se enviará el mensaje
 * @param {String} message - Mensaje a enviar
 * @returns {Promise<Boolean>} - Indica si el envío fue exitoso
 */
export async function sendBotMessage (chatId, message) {
  if (!telegramBot.isInitialized()) {
    console.error('Bot no inicializado')
    return false
  }

  try {
    await telegramBot.getInstance().api.sendMessage(chatId, message)
    return true
  } catch (error) {
    console.error('Error sending message:', error)
    return false
  }
}

/**
 * Verifica si el bot está inicializado
 * @returns {Boolean} - Indica si el bot está inicializado
 */
export function isBotInitialized () {
  return telegramBot.isInitialized()
}
