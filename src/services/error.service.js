export default class ControlledError extends Error {
  /**
   * Crea una instancia de ControlledError para manejar errores esperados en la API.
   * @param {string} message - Mensaje específico que se retornará al cliente.
   * @param {number} [statusCode=400] - Código de estado HTTP asociado al error.
   */
  constructor (message, statusCode = 400) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}
