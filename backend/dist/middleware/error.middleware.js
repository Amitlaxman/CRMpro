"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const logger_1 = require("../utils/logger");
function errorMiddleware(err, req, res, next) {
    // Structured logging via Winston
    logger_1.logger.error("Express App Error:", {
        message: err.message || "Unknown error",
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
        url: req.url,
        method: req.method,
    });
    // Handle Multer limits error specifically
    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
            success: false,
            error: "File is too large. Maximum size allowed is 25 MB.",
        });
        return;
    }
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        error: message,
    });
}
