import express from 'express'
import execute from '../../services/manager.service.js'

const router = express.Router()

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Get application log content
 *     description: Returns application log content with optional filtering. Requires valid Telegram chat ID for authorization.
 *     parameters:
 *       - name: chatId
 *         in: query
 *         required: true
 *         description: Telegram chat ID for authorization
 *         schema:
 *           type: string
 *       - name: level
 *         in: query
 *         required: false
 *         description: Filter logs by level (ERROR, WARN, INFO, DEBUG)
 *         schema:
 *           type: string
 *       - name: module
 *         in: query
 *         required: false
 *         description: Filter logs by module name
 *         schema:
 *           type: string
 *       - name: date
 *         in: query
 *         required: false
 *         description: Filter logs by date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: lines
 *         in: query
 *         required: false
 *         description: Number of lines to retrieve (default: all)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Log content
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Log file not found
 */
router.get('/', async (req, res) => {
  const params = ['chatId', 'level', 'module', 'date', 'lines']
  await execute(req, res, 'logs', 'getLogs', params)
})
export default router
