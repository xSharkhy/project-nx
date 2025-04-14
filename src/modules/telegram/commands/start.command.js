/**
 * Comando para iniciar el bot
 */
import { createCommand } from './command.base.js'
import { createLogger } from '../../../utils/logger.util.js'

const logger = createLogger('cmd-start')

/**
 * Manejador del comando start
 * @param {Object} ctx - Contexto de Telegram
 */
const handleStartCommand = async ctx => {
  const username = ctx.message.from.username || ctx.message.from.first_name

  logger.info(`Comando /start recibido de ${username}`)
  await ctx.reply(
    `¡Hola ${username}! Bienvenido al bot. Usa /help para ver la lista de comandos disponibles.`
  )
}

// Exportar el comando
export default createCommand({
  name: 'start',
  description: 'Iniciar el bot',
  handler: handleStartCommand
})
