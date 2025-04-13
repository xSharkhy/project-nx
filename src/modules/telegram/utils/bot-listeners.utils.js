/**
 * Colección de listeners para el bot de Telegram
 */

import { InputFile } from 'grammy'
import { createLogger } from '../../../utils/logger.util.js'
import { checkNSW2AmznFrAvailability } from '../../extractor/controller.js'

const logger = createLogger('bot-listeners')

// Store for active scheduled tasks with chat IDs as keys
const activeCronTasks = new Map()

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
      '/cronseensw2 - Programar comprobaciones automáticas cada 5 minutos\n' +
      '/stopcron - Detener las comprobaciones automáticas\n' +
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
    const defaultUrl = 'https://amzn.eu/d/ioGRpBq'

    logger.info(`Comando /seensw2 recibido de ${username}${url ? ` con URL: ${url}` : ''}`)

    // Validación básica de URL (si existe)
    if (url && !isValidUrl(url)) {
      await ctx.reply('La URL proporcionada no parece válida. Formato: /seensw2 [URL opcional]')
      return
    }

    const targetUrl = url || defaultUrl
    await ctx.reply(`Comprobando disponibilidad de NSW2 ${url ? 'en la URL proporcionada' : 'en Amazon Francia'}... Espere un momento.`)

    try {
      // Primero comprobar disponibilidad mediante getByRequest
      const { available, message } = await checkNSW2AmznFrAvailability(targetUrl)

      // Independientemente del resultado, tomar captura de pantalla
      await ctx.reply(`Tomando captura de pantalla de ${url ? 'la URL proporcionada' : 'Amazon Francia'}...`)

      // Tomar captura de pantalla directamente
      const { getByScraper } = await import('../../extractor/controller.js')
      const screenshotResult = await getByScraper(targetUrl)

      // Enviar mensaje sobre disponibilidad
      await ctx.reply(`Resultado: ${message}`)

      // Enviar captura de pantalla
      if (screenshotResult.screenshotBuffer) {
        await ctx.replyWithPhoto(new InputFile(screenshotResult.screenshotBuffer, 'NSW2_screenshot.png'), {
          caption: `Estado: ${available ? 'Disponible' : 'No disponible'} ${url ? 'en la URL proporcionada' : 'en Amazon Francia'}`
        })
      } else {
        await ctx.reply('No se pudo generar la captura de pantalla.')
      }
    } catch (error) {
      logger.error(`Error al procesar comando /seensw2: ${error.message}`)
      await ctx.reply('Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.')
    }
  })
}

/**
 * Configura el listener para el comando /cronseensw2
 * @param {Object} bot - Instancia del bot de Telegram
 */
export function setupCronSeeNSW2CommandListener (bot) {
  bot.command('cronseensw2', async (ctx) => {
    const chatId = ctx.chat.id
    const username = ctx.message.from.username || ctx.message.from.first_name
    // Obtener el argumento (posible URL) que viene después del comando
    const args = ctx.message.text.split(' ')
    const url = args.length > 1 ? args[1].trim() : null
    const defaultUrl = 'https://amzn.eu/d/ioGRpBq'

    // Validación básica de URL (si existe)
    if (url && !isValidUrl(url)) {
      await ctx.reply('La URL proporcionada no parece válida. Formato: /cronseensw2 [URL opcional]')
      return
    }

    const targetUrl = url || defaultUrl

    // Verificar si ya hay una tarea programada para este chat
    if (activeCronTasks.has(chatId)) {
      await ctx.reply('Ya hay una tarea de monitoreo activa. Usa /stopcron para detenerla antes de iniciar una nueva.')
      return
    }

    logger.info(`Comando /cronseensw2 recibido de ${username}${url ? ` con URL: ${targetUrl}` : ''}`)
    await ctx.reply(`Iniciando monitoreo automático de NSW2 ${url ? 'en la URL proporcionada' : 'en Amazon Francia'} cada 2 minutos.`)

    // Configurar el estado inicial antes de la primera comprobación
    activeCronTasks.set(chatId, {
      targetUrl,
      lastStatus: null,
      checkCount: 0,
      startTime: new Date()
    })

    // Función para realizar la comprobación periódica
    const checkAvailability = async () => {
      try {
        // Verificar que la tarea sigue existiendo (podría haber sido cancelada)
        if (!activeCronTasks.has(chatId)) {
          logger.info(`Comprobación cancelada para el chat ${chatId} porque la tarea ya no existe`)
          return
        }

        logger.info(`Ejecutando comprobación programada para el chat ${chatId}`)
        const { available, message } = await checkNSW2AmznFrAvailability(targetUrl)

        // Obtener la información de la tarea
        const taskInfo = activeCronTasks.get(chatId)

        // Si por alguna razón no existe la tarea, salir
        if (!taskInfo) {
          logger.error(`No se encontró información de la tarea para el chat ${chatId}`)
          return
        }

        // Incrementar el contador de comprobaciones
        taskInfo.checkCount++

        const isFirstCheck = taskInfo.lastStatus === null
        const statusChanged = taskInfo.lastStatus !== available

        // Log para depurar el estado
        logger.info(`Chat ${chatId} - Check #${taskInfo.checkCount}: lastStatus=${taskInfo.lastStatus}, current=${available}, changed=${statusChanged}`)

        // Calcular tiempo desde inicio para forzar capturas periódicas
        const currentTime = new Date()
        const minutesSinceStart = Math.floor((currentTime - taskInfo.startTime) / (60 * 1000))

        // Variable para controlar si ya se tomó una captura en esta iteración
        let screenshotTaken = false

        if (isFirstCheck || statusChanged) {
          await ctx.reply(`Actualización de estado: ${message}`)

          // Tomar captura de pantalla
          const { getByScraper } = await import('../../extractor/controller.js')
          const screenshotResult = await getByScraper(targetUrl)

          // Enviar captura
          if (screenshotResult.screenshotBuffer) {
            await ctx.replyWithPhoto(new InputFile(screenshotResult.screenshotBuffer, 'NSW2_screenshot.png'), {
              caption: `Estado: ${available ? 'Disponible' : 'No disponible'} ${url ? 'en la URL proporcionada' : 'en Amazon Francia'}`
            })
            screenshotTaken = true
          }

          // Si está disponible, enviar notificación especial
          if (available && statusChanged) {
            await ctx.reply('🚨 ¡ALERTA! 🚨 NSW2 ahora está DISPONIBLE. Revisa rápidamente la disponibilidad.')
          }
        } else {
          // Enviar actualizaciones periódicas incluso si no hay cambios
          // Cada 5 comprobaciones (aprox. 10 minutos) enviar un mensaje de estado
          if (taskInfo.checkCount % 5 === 0) {
            await ctx.reply(`Monitoreo activo: NSW2 sigue ${available ? 'disponible ✅' : 'no disponible ❌'} - Check #${taskInfo.checkCount}`)
          }

          // Garantizar capturas de pantalla regulares: cada 15 comprobaciones (30 min) O cada 60 minutos forzosamente
          const shouldTakeScreenshot =
            (taskInfo.checkCount % 15 === 0) ||
            (minutesSinceStart > 0 && minutesSinceStart % 60 === 0)

          if (shouldTakeScreenshot && !screenshotTaken) {
            await ctx.reply(`Actualización periódica - NSW2 sigue ${available ? 'disponible ✅' : 'no disponible ❌'}`)

            // Tomar captura
            const { getByScraper } = await import('../../extractor/controller.js')
            const screenshotResult = await getByScraper(targetUrl)

            if (screenshotResult.screenshotBuffer) {
              await ctx.replyWithPhoto(new InputFile(screenshotResult.screenshotBuffer, 'NSW2_screenshot.png'), {
                caption: `Estado actual: ${available ? 'Disponible' : 'No disponible'} - Actualización periódica`
              })
              screenshotTaken = true
            }
          }
        }

        // Agregar el último momento en que se envió una captura
        if (screenshotTaken) {
          taskInfo.lastScreenshotTime = currentTime
        }

        // Si han pasado más de 2 horas desde la última captura, forzar una nueva
        if (taskInfo.lastScreenshotTime &&
          (currentTime - taskInfo.lastScreenshotTime) > (2 * 60 * 60 * 1000) &&
          !screenshotTaken) {
          logger.info(`Forzando captura después de 2+ horas sin enviar para el chat ${chatId}`)
          await ctx.reply(`⏰ Actualización de seguridad: Comprobando NSW2 ${available ? '(actualmente disponible)' : '(actualmente no disponible)'}...`)

          // Tomar captura forzada
          const { getByScraper } = await import('../../extractor/controller.js')
          const screenshotResult = await getByScraper(targetUrl)

          if (screenshotResult.screenshotBuffer) {
            await ctx.replyWithPhoto(new InputFile(screenshotResult.screenshotBuffer, 'NSW2_screenshot.png'), {
              caption: `Estado actual: ${available ? 'Disponible' : 'No disponible'} - Actualización de seguridad (2h sin capturas)`
            })
            taskInfo.lastScreenshotTime = currentTime
          }
        }

        // Actualizar estado SIEMPRE después de cada comprobación
        taskInfo.lastStatus = available
        activeCronTasks.set(chatId, taskInfo)
      } catch (error) {
        logger.error(`Error en comprobación programada: ${error.message}`)
        await ctx.reply('Error al comprobar disponibilidad. El monitoreo continúa...')
      }
    }

    // Ejecutar la primera comprobación inmediatamente
    await checkAvailability()

    // Programar comprobaciones automáticas cada 2 minutos
    const interval = setInterval(checkAvailability, 2 * 60 * 1000)

    // Actualizar la tarea con el intervalo
    const taskInfo = activeCronTasks.get(chatId)
    taskInfo.interval = interval
    activeCronTasks.set(chatId, taskInfo)
  })

  // Comando para detener el monitoreo
  bot.command('stopcron', async (ctx) => {
    const chatId = ctx.chat.id
    const username = ctx.message.from.username || ctx.message.from.first_name

    logger.info(`Comando /stopcron recibido de ${username}`)

    if (activeCronTasks.has(chatId)) {
      // Detener el intervalo
      clearInterval(activeCronTasks.get(chatId).interval)

      // Calcular tiempo de ejecución
      const startTime = activeCronTasks.get(chatId).startTime
      const runTime = formatTimeDifference(new Date() - startTime)

      // Eliminar la tarea
      activeCronTasks.delete(chatId)

      await ctx.reply(`Monitoreo automático detenido. Estuvo activo durante ${runTime}.`)
    } else {
      await ctx.reply('No hay ningún monitoreo activo para detener.')
    }
  })
}

/**
 * Formatea la diferencia de tiempo en formato legible
 * @param {number} ms - Diferencia de tiempo en milisegundos
 * @returns {string} - Tiempo formateado
 */
function formatTimeDifference (ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Función auxiliar para validar URLs
 * @param {string} string - La cadena a validar como URL
 * @returns {boolean} - True si parece una URL válida
 */
function isValidUrl (string) {
  if (URL.canParse(string)) {
    return true
  }
  return false
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
