/**
 * Comando para verificar si el bot está activo
 */
import { createCommand } from './command.base.js'
import { createLogger } from '../../../utils/logger.util.js'

const logger = createLogger('cmd-ping')

/**
 * Manejador del comando ping
 * @param {Object} ctx - Contexto de Telegram
 */
const handlePingCommand = async ctx => {
  logger.info('Comando /ping recibido')
  const startTime = Date.now()
  await ctx.reply('Pinging...')
  const endTime = Date.now()
  await ctx.reply(`Pong! Respuesta en ${endTime - startTime}ms`)
}

// Exportar el comando
export default createCommand({
  name: 'ping',
  description: 'Verificar si el bot está activo',
  handler: handlePingCommand
})
