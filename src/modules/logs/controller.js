import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ControlledError from '../../services/error.service.js'
import { createLogger } from '../../utils/logger.util.js'

// Set up logger
const logger = createLogger('logs-controller')

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the logs directory (at project root)
const logsDir = path.join(__dirname, '..', '..', '..', 'logs')

// Application log file path
const APP_LOG_FILE = path.join(logsDir, 'application.log')

// Authorized Telegram chat ID
const AUTHORIZED_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1234567890'

/**
 * Retrieves log file content with optional filtering
 * @param {String} chatId - Telegram chat ID for authorization
 * @param {String} [level] - Filter logs by level (ERROR, WARN, INFO, DEBUG)
 * @param {String} [module] - Filter logs by module name
 * @param {String} [date] - Filter logs by date (YYYY-MM-DD)
 * @param {Number} [lines] - Number of lines to retrieve (default: all)
 * @param {String} [logName] - Optional specific log name for backward compatibility
 * @returns {Object} - Log content
 */
export async function getLogs (chatId, level, module, date, lines, logName) {
  // Validate chat ID
  if (!chatId || chatId !== AUTHORIZED_CHAT_ID) {
    logger.warn(`Unauthorized access attempt with chat ID: ${chatId}`)
    throw new ControlledError('Unauthorized access', 403)
  }
  // Check if application log file exists
  if (!fs.existsSync(APP_LOG_FILE)) {
    logger.warn('Application log file not found')
    return { statusCode: 404, body: { error: 'Log file not found' } }
  }

  // Read file content
  const content = fs.readFileSync(APP_LOG_FILE, 'utf8')

  // Split content into lines for filtering
  let linesArray = content.split('\n').filter(line => line.trim() !== '')

  // Apply filters if provided
  if (level) {
    linesArray = linesArray.filter(line => line.includes(`[${level}]`))
  }

  if (module) {
    linesArray = linesArray.filter(line => line.includes(`[${module}]`))
  }

  if (date) {
    linesArray = linesArray.filter(line => line.includes(date))
  }

  // Limit number of lines if needed
  if (lines && !isNaN(parseInt(lines))) {
    linesArray = linesArray.slice(-parseInt(lines))
  }

  // Stats about the log file
  const stats = fs.statSync(APP_LOG_FILE)
  const fileInfo = {
    size: stats.size,
    lastModified: stats.mtime,
    totalLines: content.split('\n').filter(line => line.trim() !== '').length,
    filteredLines: linesArray.length
  }

  logger.info(`Log file retrieved with ${linesArray.length} lines`)
  return {
    statusCode: 200,
    body: {
      filename: 'application.log',
      fileInfo,
      content: linesArray.join('\n')
    }
  }
}
