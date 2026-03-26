export class AppError extends Error {
  public statusCode: number;
  public payload: unknown;

  constructor(message: string, statusCode: number = 400, payload: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.payload = payload;
    this.name = 'AppError';
    Error.captureStackTrace(this, AppError);
  }
}
