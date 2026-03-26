export class AppError extends Error {
  constructor(message, statusCode = 400, payload = null) {
    super(message)
    this.statusCode = statusCode
    this.payload = payload
    Error.captureStackTrace(this, AppError)
  }
}