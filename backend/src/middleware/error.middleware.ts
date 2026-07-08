import { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Structured logging via Winston
  logger.error("Express App Error:", {
    message: err.message || "Unknown error",
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    url: req.url,
    method: req.method,
  })

  // Handle Multer limits error specifically
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      success: false,
      error: "File is too large. Maximum size allowed is 25 MB.",
    })
    return
  }

  const statusCode = err.status || 500
  const message = process.env.NODE_ENV === "production" && statusCode === 500
    ? "Internal Server Error"
    : err.message || "Internal Server Error"

  res.status(statusCode).json({
    success: false,
    error: message,
  })
}
