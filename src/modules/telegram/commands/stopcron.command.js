/**
 * Comando para detener el monitoreo automático
 */
import { createCommand } from './command.base.js'
import { createLogger } from '../../../utils/logger.util.js'
import { activeCronTasks, formatTimeDifference } from './cronseensw2.command.js'

const logger = createLogger('cmd-stopcron')

/**
 * Manejador del comando stopcron
 * @param {Object} ctx - Contexto de Telegram
 */
const handleStopCronCommand = async ctx => {
  const chatId = ctx.chat.id
  const username = ctx.message.from.username || ctx.message.from.first_name

  logger.info(`Comando /stopcron recibido de ${username}`)

  if (activeCronTasks && activeCronTasks.has(chatId)) {
    // Detener el intervalo
    clearInterval(activeCronTasks.get(chatId).interval)

    // Calcular tiempo de ejecución
    const startTime = activeCronTasks.get(chatId).startTime
    const runTime = formatTimeDifference(new Date() - startTime)

    // Eliminar la tarea
    activeCronTasks.delete(chatId)

    await ctx.reply(
      `Monitoreo automático detenido. Estuvo activo durante ${runTime}.`
    )
  } else {
    await ctx.reply('No hay ningún monitoreo activo para detener.')
  }
}

// Exportar el comando
export default createCommand({
  name: 'stopcron',
  description: 'Detener las comprobaciones automáticas',
  handler: handleStopCronCommand
})
