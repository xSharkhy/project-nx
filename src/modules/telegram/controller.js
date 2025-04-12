import { sendBotMessage, isBotInitialized } from './services/telegram.service.js'

/**
 * Envía un mensaje de prueba a través del bot de Telegram
 * @param {String} chatId - ID del chat al que se enviará el mensaje
 * @returns {Object} - Resultado de la operación
 */
export async function sendTestMessage (chatId) {
  if (!chatId) {
    return { statusCode: 400, body: { error: 'chatId is required' } }
  }

  if (!isBotInitialized()) {
    return { statusCode: 500, body: { error: 'Bot no inicializado' } }
  }

  const success = await sendBotMessage(chatId, 'Hello from the server!')

  if (success) {
    return { statusCode: 200, body: { message: 'Message sent!' } }
  } else {
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

  if (!isBotInitialized()) {
    return { statusCode: 500, body: { error: 'Bot no inicializado' } }
  }

  const success = await sendBotMessage(chatId, message)

  if (success) {
    return { statusCode: 200, body: { message: 'Message sent!' } }
  } else {
    return { statusCode: 500, body: { error: 'Failed to send message' } }
  }
}
