/**
 * Colección de listeners para el bot de Telegram
 */

import { InputFile } from 'grammy'
import { createLogger } from '../../../utils/logger.util.js'
import { checkNSW2AmznFrAvailability } from '../../extractor/controller.js'

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
      '/seensw2 - Comprobar disponibilidad de NSW2 en Amazon Francia\n' +
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
 * Configura el listener para el comando /seensw2
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupSeeNSW2CommandListener (bot) {
  bot.command('seensw2', async (ctx) => {
    const username = ctx.message.from.username || ctx.message.from.first_name
    // Obtener el argumento (posible URL) que viene después del comando
    const args = ctx.message.text.split(' ')
    const url = args.length > 1 ? args[1].trim() : null

    logger.info(`Comando /seensw2 recibido de ${username}${url ? ` con URL: ${url}` : ''}`)

    // Validación básica de URL (si existe)
    if (url && !isValidUrl(url)) {
      await ctx.reply('La URL proporcionada no parece válida. Formato: /seensw2 [URL opcional]')
      return
    }

    await ctx.reply(`Comprobando disponibilidad de NSW2 ${url ? 'en la URL proporcionada' : 'en Amazon Francia'}... Espere un momento.`)

    try {
      // Pasar la URL a la función si existe
      const result = await checkNSW2AmznFrAvailability(url)

      if (result.available) {
        await ctx.reply(`¡NSW2 está disponible${url ? ' en la URL proporcionada' : ' en Amazon Francia'}! Enviando captura de pantalla...`)

        if (result.screenshotBuffer) {
          // Usar el buffer directamente con InputFile
          await ctx.replyWithPhoto(new InputFile(result.screenshotBuffer, 'NSW2_screenshot.png'), {
            caption: `NSW2 disponible ${url ? 'en la URL proporcionada' : 'en Amazon Francia'}`
          })
        } else {
          await ctx.reply('No se pudo generar la captura de pantalla, pero el producto parece estar disponible.')
        }
      } else {
        await ctx.reply(`NSW2 aún no está disponible${url ? ' en la URL proporcionada' : ' en Amazon Francia'}. Te avisaré cuando esté disponible.`)
      }
    } catch (error) {
      logger.error(`Error al comprobar disponibilidad: ${error.message}`)
      await ctx.reply('Ocurrió un error al comprobar la disponibilidad de NSW2. Inténtalo de nuevo más tarde.')
    }
  })
}

/**
 * Función auxiliar para validar URLs
 * @param {string} string - La cadena a validar como URL
 * @returns {boolean} - True si parece una URL válida
 */
function isValidUrl (string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
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
