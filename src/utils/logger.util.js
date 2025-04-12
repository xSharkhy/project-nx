import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import formatDate from './date.utils.js'

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the logs directory (at project root)
const logsDir = path.join(__dirname, '..', '..', 'logs')

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Log levels
const LOG_LEVELS = {
  ERROR: { priority: 0, label: 'ERROR', color: '\x1b[31m' }, // Red
  WARN: { priority: 1, label: 'WARN', color: '\x1b[33m' }, // Yellow
  INFO: { priority: 2, label: 'INFO', color: '\x1b[36m' }, // Cyan
  DEBUG: { priority: 3, label: 'DEBUG', color: '\x1b[90m' } // Gray
}

/**
 * Creates a logger instance for a specific module
 * @param {String} moduleName - Name of the module for which the logger is being created
 * @param {Object} options - Configuration options
 * @param {Boolean} options.console - Whether to log to console (default: true)
 * @param {Boolean} options.file - Whether to log to file (default: true)
 * @param {String} options.level - Minimum log level to record (default: 'INFO')
 * @returns {Object} - Logger object with methods for each log level
 */
export function createLogger (moduleName, options = {}) {
  const {
    console: logToConsole = true,
    file: logToFile = true,
    level = 'INFO'
  } = options

  const minLevel = LOG_LEVELS[level] ? LOG_LEVELS[level].priority : LOG_LEVELS.INFO.priority

  // Create log filename based on module name
  const logFileName = path.join(logsDir, `${moduleName.replace(/[^a-z0-9]/gi, '-')}.log`)

  /**
   * Write a log message to file
   * @param {String} level - Log level
   * @param {String} message - Log message
   */
  function writeToFile (level, message) {
    if (!logToFile) return

    const timestamp = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss.SSS')
    const logLine = `[${timestamp}] [${level}] ${message}\n`

    fs.appendFile(logFileName, logLine, (err) => {
      if (err) {
        console.error(`Error writing to log file: ${err.message}`)
      }
    })
  }

  /**
   * Print a log message to console
   * @param {String} level - Log level object
   * @param {String} message - Log message
   */
  function printToConsole (level, message) {
    if (!logToConsole) return

    const timestamp = formatDate(new Date(), 'HH:mm:ss')
    const resetColor = '\x1b[0m'
    const moduleText = `\x1b[35m[${moduleName}]\x1b[0m` // Purple color for module name

    console.log(`${level.color}[${timestamp}] [${level.label}]${resetColor} ${moduleText} ${message}`)
  }

  /**
   * Log a message with specified level
   * @param {Object} level - Log level object
   * @param {String} message - Log message or format string
   * @param  {...any} args - Optional arguments for format string
   */
  function log (level, message, ...args) {
    if (level.priority > minLevel) return

    // Format message if args provided
    let formattedMessage = message
    if (args.length > 0) {
      formattedMessage = message.replace(/%[sdjifoO%]/g, (match) => {
        if (match === '%%') return '%'
        const arg = args.shift()
        if (arg === undefined) return match
        if (typeof arg === 'object') return JSON.stringify(arg)
        return String(arg)
      })
    }

    printToConsole(level, formattedMessage)
    writeToFile(level.label, formattedMessage)
  }

  return {
    /**
     * Log a debug message
     * @param {String} message - Message to log
     * @param  {...any} args - Optional format arguments
     */
    debug (message, ...args) {
      log(LOG_LEVELS.DEBUG, message, ...args)
    },

    /**
     * Log an info message
     * @param {String} message - Message to log
     * @param  {...any} args - Optional format arguments
     */
    info (message, ...args) {
      log(LOG_LEVELS.INFO, message, ...args)
    },

    /**
     * Log a warning message
     * @param {String} message - Message to log
     * @param  {...any} args - Optional format arguments
     */
    warn (message, ...args) {
      log(LOG_LEVELS.WARN, message, ...args)
    },

    /**
     * Log an error message
     * @param {String} message - Message to log
     * @param  {...any} args - Optional format arguments
     */
    error (message, ...args) {
      log(LOG_LEVELS.ERROR, message, ...args)
    }
  }
}

// Create a default logger
export const logger = createLogger('app')
