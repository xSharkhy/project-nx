/**
 * Comando para comprobar disponibilidad de NSW2 en Amazon
 */
import { createCommand } from './command.base.js'
import { createLogger } from '../../../utils/logger.util.js'
import { InputFile } from 'grammy'
import { checkNSW2AmznFrAvailability } from '../../extractor/controller.js'

const logger = createLogger('cmd-seensw2')

/**
 * Valida si una cadena es una URL válida
 * @param {string} string - URL a validar
 * @returns {boolean} - True si es válida
 */
const isValidUrl = string => {
  if (URL.canParse(string)) {
    return true
  }
  return false
}

/**
 * Manejador del comando seensw2
 * @param {Object} ctx - Contexto de Telegram
 */
const handleSeeNSW2Command = async ctx => {
  const username = ctx.message.from.username || ctx.message.from.first_name
  // Obtener el argumento (posible URL) que viene después del comando
  const args = ctx.message.text.split(' ')
  const url = args.length > 1 ? args[1].trim() : null
  const defaultUrl = 'https://amzn.eu/d/ioGRpBq'

  logger.info(
    `Comando /seensw2 recibido de ${username}${url ? ` con URL: ${url}` : ''}`
  )

  // Validación básica de URL (si existe)
  if (url && !isValidUrl(url)) {
    await ctx.reply(
      'La URL proporcionada no parece válida. Formato: /seensw2 [URL opcional]'
    )
    return
  }

  const targetUrl = url || defaultUrl
  await ctx.reply(
    `Comprobando disponibilidad de NSW2 ${
      url ? 'en la URL proporcionada' : 'en Amazon Francia'
    }... Espere un momento.`
  )

  try {
    // Primero comprobar disponibilidad mediante getByRequest
    const { available, message } = await checkNSW2AmznFrAvailability(targetUrl)

    // Independientemente del resultado, tomar captura de pantalla
    await ctx.reply(
      `Tomando captura de pantalla de ${
        url ? 'la URL proporcionada' : 'Amazon Francia'
      }...`
    )

    // Tomar captura de pantalla directamente
    const { getByScraper } = await import('../../extractor/controller.js')
    const screenshotResult = await getByScraper(targetUrl)

    // Enviar mensaje sobre disponibilidad
    await ctx.reply(`Resultado: ${message}`)

    // Enviar captura de pantalla
    if (screenshotResult.screenshotBuffer) {
      await ctx.replyWithPhoto(
        new InputFile(screenshotResult.screenshotBuffer, 'NSW2_screenshot.png'),
        {
          caption: `Estado: ${available ? 'Disponible' : 'No disponible'} ${
            url ? 'en la URL proporcionada' : 'en Amazon Francia'
          }`
        }
      )
    } else {
      await ctx.reply('No se pudo generar la captura de pantalla.')
    }
  } catch (error) {
    logger.error(`Error al procesar comando /seensw2: ${error.message}`)
    await ctx.reply(
      'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.'
    )
  }
}

// Exportar el comando
export default createCommand({
  name: 'seensw2',
  description: 'Comprobar disponibilidad de NSW2 en Amazon Francia',
  handler: handleSeeNSW2Command
})
