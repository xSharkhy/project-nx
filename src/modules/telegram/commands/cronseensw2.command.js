/**
 * Comando para monitoreo automático de disponibilidad de NSW2
 */
import { createCommand } from './command.base.js'
import { createLogger } from '../../../utils/logger.util.js'
import { InputFile } from 'grammy'
import { checkNSW2AmznFrAvailability } from '../../extractor/controller.js'

const logger = createLogger('cmd-cronseensw2')

// Store para tareas activas con chatIds como claves - compartido entre comandos
export const activeCronTasks = new Map()

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
 * Formatea la diferencia de tiempo en formato legible
 * @param {number} ms - Diferencia de tiempo en milisegundos
 * @returns {string} - Tiempo formateado
 */
export const formatTimeDifference = ms => {
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
 * Realiza la comprobación periódica de disponibilidad
 * @param {Object} ctx - Contexto de Telegram
 * @param {number} chatId - ID del chat
 * @param {string} targetUrl - URL a monitorear
 * @param {string|null} url - URL original proporcionada (para mensajes)
 */
const checkAvailability = async (ctx, chatId, targetUrl, url) => {
  try {
    // Verificar que la tarea sigue existiendo (podría haber sido cancelada)
    if (!activeCronTasks.has(chatId)) {
      logger.info(
        `Comprobación cancelada para el chat ${chatId} porque la tarea ya no existe`
      )
      return
    }

    logger.info(`Ejecutando comprobación programada para el chat ${chatId}`)
    const { available, message } = await checkNSW2AmznFrAvailability(targetUrl)

    // Obtener la información de la tarea
    const taskInfo = activeCronTasks.get(chatId)

    // Si por alguna razón no existe la tarea, salir
    if (!taskInfo) {
      logger.error(
        `No se encontró información de la tarea para el chat ${chatId}`
      )
      return
    }

    // Incrementar el contador de comprobaciones
    const updatedTaskInfo = {
      ...taskInfo,
      checkCount: taskInfo.checkCount + 1
    }

    const isFirstCheck = taskInfo.lastStatus === null
    const statusChanged = taskInfo.lastStatus !== available

    // Log para depurar el estado
    logger.info(
      `Chat ${chatId} - Check #${updatedTaskInfo.checkCount}: lastStatus=${taskInfo.lastStatus}, current=${available}, changed=${statusChanged}`
    )

    // Calcular tiempo desde inicio para forzar capturas periódicas
    const currentTime = new Date()
    const minutesSinceStart = Math.floor(
      (currentTime - taskInfo.startTime) / (60 * 1000)
    )

    // Variable para controlar si ya se tomó una captura en esta iteración
    let screenshotTaken = false

    if (isFirstCheck || statusChanged) {
      await ctx.reply(`Actualización de estado: ${message}`)

      // Tomar captura de pantalla
      const { getByScraper } = await import('../../extractor/controller.js')
      const screenshotResult = await getByScraper(targetUrl)

      // Enviar captura
      if (screenshotResult.screenshotBuffer) {
        await ctx.replyWithPhoto(
          new InputFile(
            screenshotResult.screenshotBuffer,
            'NSW2_screenshot.png'
          ),
          {
            caption: `Estado: ${available ? 'Disponible' : 'No disponible'} ${
              url ? 'en la URL proporcionada' : 'en Amazon Francia'
            }`
          }
        )
        screenshotTaken = true
      }

      // Si está disponible, enviar notificación especial
      if (available && statusChanged) {
        await ctx.reply(
          '🚨 ¡ALERTA! 🚨 NSW2 ahora está DISPONIBLE. Revisa rápidamente la disponibilidad.'
        )
      }
    } else {
      // Enviar actualizaciones periódicas incluso si no hay cambios
      // Cada 5 comprobaciones (aprox. 10 minutos) enviar un mensaje de estado
      if (updatedTaskInfo.checkCount % 5 === 0) {
        await ctx.reply(
          `Monitoreo activo: NSW2 sigue ${
            available ? 'disponible ✅' : 'no disponible ❌'
          } - Check #${updatedTaskInfo.checkCount}`
        )
      }

      // Garantizar capturas de pantalla regulares: cada 15 comprobaciones (30 min) O cada 60 minutos forzosamente
      const shouldTakeScreenshot =
        updatedTaskInfo.checkCount % 15 === 0 ||
        (minutesSinceStart > 0 && minutesSinceStart % 60 === 0)

      if (shouldTakeScreenshot && !screenshotTaken) {
        await ctx.reply(
          `Actualización periódica - NSW2 sigue ${
            available ? 'disponible ✅' : 'no disponible ❌'
          }`
        )

        // Tomar captura
        const { getByScraper } = await import('../../extractor/controller.js')
        const screenshotResult = await getByScraper(targetUrl)

        if (screenshotResult.screenshotBuffer) {
          await ctx.replyWithPhoto(
            new InputFile(
              screenshotResult.screenshotBuffer,
              'NSW2_screenshot.png'
            ),
            {
              caption: `Estado actual: ${
                available ? 'Disponible' : 'No disponible'
              } - Actualización periódica`
            }
          )
          screenshotTaken = true
        }
      }
    }

    // Agregar el último momento en que se envió una captura
    let updatedTaskInfoWithScreenshot = updatedTaskInfo
    if (screenshotTaken) {
      updatedTaskInfoWithScreenshot = {
        ...updatedTaskInfo,
        lastScreenshotTime: currentTime
      }
    }

    // Si han pasado más de 2 horas desde la última captura, forzar una nueva
    if (
      taskInfo.lastScreenshotTime &&
      currentTime - taskInfo.lastScreenshotTime > 2 * 60 * 60 * 1000 &&
      !screenshotTaken
    ) {
      logger.info(
        `Forzando captura después de 2+ horas sin enviar para el chat ${chatId}`
      )
      await ctx.reply(
        `⏰ Actualización de seguridad: Comprobando NSW2 ${
          available ? '(actualmente disponible)' : '(actualmente no disponible)'
        }...`
      )

      // Tomar captura forzada
      const { getByScraper } = await import('../../extractor/controller.js')
      const screenshotResult = await getByScraper(targetUrl)

      if (screenshotResult.screenshotBuffer) {
        await ctx.replyWithPhoto(
          new InputFile(
            screenshotResult.screenshotBuffer,
            'NSW2_screenshot.png'
          ),
          {
            caption: `Estado actual: ${
              available ? 'Disponible' : 'No disponible'
            } - Actualización de seguridad (2h sin capturas)`
          }
        )
        updatedTaskInfoWithScreenshot = {
          ...updatedTaskInfoWithScreenshot,
          lastScreenshotTime: currentTime
        }
      }
    }

    // Actualizar estado SIEMPRE después de cada comprobación
    activeCronTasks.set(chatId, {
      ...updatedTaskInfoWithScreenshot,
      lastStatus: available
    })
  } catch (error) {
    logger.error(`Error en comprobación programada: ${error.message}`)
    await ctx.reply(
      'Error al comprobar disponibilidad. El monitoreo continúa...'
    )
  }
}

/**
 * Manejador del comando cronseensw2
 * @param {Object} ctx - Contexto de Telegram
 */
const handleCronSeeNSW2Command = async ctx => {
  const chatId = ctx.chat.id
  const username = ctx.message.from.username || ctx.message.from.first_name
  // Obtener el argumento (posible URL) que viene después del comando
  const args = ctx.message.text.split(' ')
  const url = args.length > 1 ? args[1].trim() : null
  const defaultUrl = 'https://amzn.eu/d/ioGRpBq'

  // Validación básica de URL (si existe)
  if (url && !isValidUrl(url)) {
    await ctx.reply(
      'La URL proporcionada no parece válida. Formato: /cronseensw2 [URL opcional]'
    )
    return
  }

  const targetUrl = url || defaultUrl

  // Verificar si ya hay una tarea programada para este chat
  if (activeCronTasks.has(chatId)) {
    await ctx.reply(
      'Ya hay una tarea de monitoreo activa. Usa /stopcron para detenerla antes de iniciar una nueva.'
    )
    return
  }

  logger.info(
    `Comando /cronseensw2 recibido de ${username}${
      url ? ` con URL: ${targetUrl}` : ''
    }`
  )
  await ctx.reply(
    `Iniciando monitoreo automático de NSW2 ${
      url ? 'en la URL proporcionada' : 'en Amazon Francia'
    } cada 2 minutos.`
  )

  // Configurar el estado inicial antes de la primera comprobación
  activeCronTasks.set(chatId, {
    targetUrl,
    lastStatus: null,
    checkCount: 0,
    startTime: new Date()
  })

  // Ejecutar la primera comprobación inmediatamente
  await checkAvailability(ctx, chatId, targetUrl, url)

  // Programar comprobaciones automáticas cada 2 minutos
  const interval = setInterval(
    () => checkAvailability(ctx, chatId, targetUrl, url),
    2 * 60 * 1000
  )

  // Actualizar la tarea con el intervalo
  const taskInfo = activeCronTasks.get(chatId)
  activeCronTasks.set(chatId, {
    ...taskInfo,
    interval
  })
}

// Exportar el comando
export default createCommand({
  name: 'cronseensw2',
  description: 'Programar comprobaciones automáticas cada 2 minutos',
  handler: handleCronSeeNSW2Command
})
