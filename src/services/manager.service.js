import log from '../utils/console.util.js'
import ControlledError from './error.service.js'
import { createLogger } from '../utils/logger.util.js'

const logger = createLogger('manager-service')

const HTTP_METHODS = {
  get: 'query',
  post: 'body',
  put: 'body',
  delete: 'query',
  patch: 'body'
}

const getArgs = (req) => {
  if (!req || !req.method) {
    throw new ControlledError('Invalid request object', 400)
  }

  const method = req.method.toLowerCase()
  const sourceKey = HTTP_METHODS[method]

  if (!sourceKey) {
    throw new ControlledError(`HTTP method not supported: ${req.method}`, 400)
  }

  return req[sourceKey]
}

export default async function execute (req, res, entity, functionName, params) {
  let args = null

  try {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const requestUrl = `${req.method} ${req.originalUrl}`

    logger.info(`Request started: ${requestUrl} from ${clientIP}`)
    log(2, entity, functionName, 'Starting execution...')

    const controller = await import(`../modules/${entity}/controller.js`)

    args = getArgs(req)
    const argValues = params.map((param) => (args[param] !== undefined ? args[param] : null))

    let execution
    if (params[0] === 'req') {
      argValues.shift()
      execution = await controller[functionName](req, ...argValues)
    } else {
      execution = await controller[functionName](...argValues)
    }

    const response = {}

    if (!execution || (Array.isArray(execution) && execution.length === 0)) {
      response.statusCode = 204
      response.message = 'No data found.'
    } else {
      response.statusCode = execution.statusCode || 200
      response.body = execution.body || execution
    }

    log(2, entity, functionName, 'Execution completed successfully.')
    logger.info(`Request finished: ${requestUrl} - Status: ${response.statusCode}`)

    return res.status(response.statusCode).send(response)
  } catch (error) {
    try {
      if (error instanceof ControlledError) {
        log(3, 'Manager', 'Controlled Error', `Execution failed: ${error.message}`)
        logger.warn(`Request failed: ${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}`)
        return res.status(error.statusCode).send({ message: error.message })
      } else {
        log(4, 'Manager', 'Unexpected Error', `Execution failed: ${error.message}`)
        logger.error(`Request error: ${req.method} ${req.originalUrl} - ${error.message}`)
        console.debug(error.stack)
        return res.status(500).send({ statusCode: error.statusCode, message: 'Internal server error.' })
      }
    } catch (innerError) {
      log(5, 'Manager', 'Manager Error Handler', `Error handling failed: ${innerError.message}`)
      logger.error(`Error handling failed: ${innerError.message}`)
      console.debug(innerError.stack)
      return res.status(500).send({ message: 'Internal server error.' })
    }
  }
}
