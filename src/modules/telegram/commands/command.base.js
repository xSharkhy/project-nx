/**
 * Funciones base para crear comandos del bot de Telegram
 */

/**
 * Crea un comando para el bot de Telegram
 * @param {Object} options - Opciones del comando
 * @param {string} options.name - Nombre del comando sin la barra (/)
 * @param {string} options.description - Descripción del comando para la ayuda
 * @param {Function} options.handler - Función que maneja el comando (ctx) => Promise<void>
 * @returns {Object} - Objeto del comando
 */
export const createCommand = ({ name, description, handler }) => {
  if (!name || !description || typeof handler !== 'function') {
    throw new Error(
      'Un comando necesita un nombre, descripción y un manejador de función'
    )
  }

  return {
    name,
    description,
    handler,
    // Método para registrar el comando en el bot
    register: bot => bot.command(name, handler)
  }
}

/**
 * Registra un comando en el bot
 * @param {Object} bot - Instancia del bot
 * @param {Object} command - Comando creado con createCommand
 */
export const registerCommand = (bot, command) => {
  command.register(bot)
  return bot // Para encadenamiento de funciones
}

/**
 * Registra múltiples comandos en el bot
 * @param {Object} bot - Instancia del bot
 * @param {Array} commands - Array de comandos
 */
export const registerCommands = (bot, commands) => {
  commands.forEach(command => registerCommand(bot, command))
  return bot // Para encadenamiento de funciones
}
