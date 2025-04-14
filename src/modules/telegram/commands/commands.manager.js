/**
 * Gestor de comandos para el bot de Telegram con enfoque funcional
 */
import { createLogger } from '../../../utils/logger.util.js'
import { registerCommand, registerCommands } from './command.base.js'

const logger = createLogger('commands-manager')

// Store inmutable para los comandos
let commands = []

/**
 * Añade un comando al store
 * @param {Object} command - Comando a registrar
 * @returns {Array} - Nueva lista de comandos
 */
export const addCommand = command => {
  commands = [...commands, command]
  logger.info(`Comando /${command.name} registrado`)
  return commands
}

/**
 * Añade múltiples comandos al store
 * @param {Array} newCommands - Comandos a registrar
 * @returns {Array} - Nueva lista de comandos
 */
export const addCommands = newCommands => {
  commands = [...commands, ...newCommands]
  newCommands.forEach(cmd => logger.info(`Comando /${cmd.name} registrado`))
  return commands
}

/**
 * Configura todos los comandos en el bot
 * @param {Object} bot - Instancia del bot de Telegram
 * @returns {Object} - Instancia del bot
 */
export const setupCommands = bot => {
  registerCommands(bot, commands)
  commands.forEach(cmd =>
    logger.info(`Comando /${cmd.name} configurado en el bot`)
  )
  return bot
}

/**
 * Obtiene la lista de todos los comandos registrados
 * @returns {Array<Object>} - Lista de comandos con su nombre y descripción
 */
export const getCommandList = () => {
  return commands.map(({ name, description }) => ({ name, description }))
}

/**
 * Genera un mensaje de ayuda con todos los comandos disponibles
 * @returns {string} - Mensaje con la lista de comandos y sus descripciones
 */
export const getHelpMessage = () => {
  let message = 'Comandos disponibles:\n'

  commands.forEach(({ name, description }) => {
    message += `/${name} - ${description}\n`
  })

  return message
}

// Exportaciones por defecto para compatibilidad con el código existente
export default {
  addCommand,
  addCommands,
  setupCommands,
  getCommandList,
  getHelpMessage
}
