import { logger } from "../utils/logger.js"

export function errorHandler(err, req, res, next) {
  logger.error("Unhandled error:", err.message, err.stack)

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate entry",
    })
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
  })
}
