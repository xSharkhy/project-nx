/**
 * Archivo índice que exporta todos los comandos disponibles
 */
import { addCommands, setupCommands } from './commands.manager.js'

// Importar todos los comandos
import startCommand from './start.command.js'
import helpCommand from './help.command.js'
import pingCommand from './ping.command.js'
import seeNSW2Command from './seensw2.command.js'
import cronSeeNSW2Command from './cronseensw2.command.js'
import stopCronCommand from './stopcron.command.js'

// Registrar todos los comandos en el gestor
addCommands([
  startCommand,
  helpCommand,
  pingCommand,
  seeNSW2Command,
  cronSeeNSW2Command,
  stopCronCommand
])

// Exportar funciones del gestor de comandos
export { setupCommands }

// Para compatibilidad con código existente
export default {
  setupCommands
}
