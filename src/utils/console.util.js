import ControlledError from '../services/error.service.js'

const LOG_LEVEL_MAP = {
  8: 'unknown',
  7: 'emergency',
  6: 'alert',
  5: 'critical',
  4: 'error',
  3: 'warning',
  2: 'info',
  1: 'debug',
  0: 'trace'
}

const EMOJI_MAP = {
  unknown: '❓',
  emergency: '❗️',
  alert: '🚨',
  critical: '🔴',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  debug: '🐛',
  trace: '🔍'
}

const VALID_LOG_TYPES = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'info',
  'debug',
  'trace',
  'unknown'
]

const log = async (type, entityName, functionName, message) => {
  try {
    // Validación de parámetros
    if (typeof entityName !== 'string' || entityName.trim().length < 3) {
      throw new ControlledError("Invalid input value 'entityName'", 400)
    }
    if (typeof functionName !== 'string' || functionName.trim().length < 3) {
      throw new ControlledError("Invalid input value 'functionName'", 400)
    }
    if (message === undefined || message === null) {
      throw new ControlledError("Invalid input value 'message'", 400)
    }

    // Procesa el tipo (número o cadena)
    if (typeof type === 'number') {
      if (!(type in LOG_LEVEL_MAP)) {
        throw new ControlledError(`Invalid input value 'type': ${type}`, 400)
      }
      type = LOG_LEVEL_MAP[type]
    } else if (typeof type === 'string') {
      type = type.toLowerCase()
      if (!VALID_LOG_TYPES.includes(type)) {
        throw new ControlledError(`Invalid input value 'type': ${type}`, 400)
      }
    } else {
      throw new ControlledError(`Invalid input type for 'type': ${type}`, 400)
    }

    const emoji = EMOJI_MAP[type]
    if (!emoji) {
      throw new ControlledError(
        `Error identifying the emoji for log type: ${type}`,
        400
      )
    }

    // Construye el mensaje de log usando template literals.
    // Se muestra el tipo en mayúsculas para mayor legibilidad.
    const logMessage = `[${type.toUpperCase()}][${entityName
      .trim()
      .toUpperCase()}][${functionName.trim().toUpperCase()}] ${message}`
    console.log(`${emoji}${logMessage}`)
  } catch (error) {
    if (error instanceof ControlledError) {
      console.log(`❌[ERROR][UTILS][CONSOLE-LOG] ${error.message}`)
    } else {
      console.log(
        `❌[ERROR][UTILS][CONSOLE-LOG] Unexpected error: ${
          error.message || error
        }`
      )
    }
  }
}

export default log
