/**
 * Colección de listeners para el bot de Telegram
 */

import { createLogger } from '../../../utils/logger.util.js'

const logger = createLogger('bot-listeners')

/**
 * Configura el listener para los mensajes de texto
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupMessageListener (bot) {
  bot.on('message:text', async (ctx) => {
    const message = ctx.message.text
    const username = ctx.message.from.username || ctx.message.from.first_name

    logger.info(`Mensaje recibido de ${username}: ${message}`)
    await ctx.reply(`Recibido: ${message}`)
  })
}

/**
 * Configura el listener para el comando /start
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupStartCommandListener (bot) {
  bot.command('start', async (ctx) => {
    const username = ctx.message.from.username || ctx.message.from.first_name

    logger.info(`Comando /start recibido de ${username}`)
    await ctx.reply(
      `¡Hola ${username}! Bienvenido al bot. Usa /help para ver la lista de comandos disponibles.`
    )
  })
}

/**
 * Configura el listener para el comando /help
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupHelpCommandListener (bot) {
  bot.command('help', async (ctx) => {
    logger.info('Comando /help recibido')
    await ctx.reply(
      'Comandos disponibles:\n' +
      '/start - Iniciar el bot\n' +
      '/help - Mostrar esta ayuda\n' +
      '/ping - Verificar si el bot está activo\n' +
      '/status - Ver el estado del servidor\n' +
      '/info - Información sobre el bot'
    )
  })
}

/**
 * Configura el listener para el comando /ping
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupPingCommandListener (bot) {
  bot.command('ping', async (ctx) => {
    logger.info('Comando /ping recibido')
    const startTime = Date.now()
    await ctx.reply('Pinging...')
    const endTime = Date.now()
    await ctx.reply(`Pong! Respuesta en ${endTime - startTime}ms`)
  })
}

/**
 * Configura el listener para las imágenes y archivos
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupMediaListener (bot) {
  // Listener para fotos
  bot.on('message:photo', async (ctx) => {
    const username = ctx.message.from.username || ctx.message.from.first_name
    logger.info(`Foto recibida de ${username}`)
    await ctx.reply('He recibido tu foto. ¡Gracias por compartirla!')
  })

  // Listener para documentos
  bot.on('message:document', async (ctx) => {
    const username = ctx.message.from.username || ctx.message.from.first_name
    const filename = ctx.message.document.file_name || 'documento'
    logger.info(`Documento recibido de ${username}: ${filename}`)
    await ctx.reply(`He recibido tu archivo: ${filename}`)
  })
}
