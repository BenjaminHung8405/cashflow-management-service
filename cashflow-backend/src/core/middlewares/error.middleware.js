export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || "Internal Server Error"
  const details = process.env.NODE_ENV === "production" ? undefined : err.stack

  res.status(status).json({
    status: "error",
    message,
    ...(details ? { details } : {}),
  })
}