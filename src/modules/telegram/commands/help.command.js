/**
 * Comando para mostrar la ayuda del bot
 */
import { createCommand } from './command.base.js'
import { createLogger } from '../../../utils/logger.util.js'
import { getHelpMessage } from './commands.manager.js'

const logger = createLogger('cmd-help')

/**
 * Manejador del comando help
 * @param {Object} ctx - Contexto de Telegram
 */
const handleHelpCommand = async ctx => {
  logger.info('Comando /help recibido')
  // Utiliza el gestor de comandos para generar la ayuda dinámica
  await ctx.reply(getHelpMessage())
}

// Exportar el comando
export default createCommand({
  name: 'help',
  description: 'Mostrar esta ayuda',
  handler: handleHelpCommand
})
