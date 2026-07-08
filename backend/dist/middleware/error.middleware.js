"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(err, req, res, next) {
    console.error("Global Error Caught:", err);
    // Handle Multer limits error specifically
    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
            success: false,
            error: "File is too large. Maximum size allowed is 25 MB.",
        });
        return;
    }
    const statusCode = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        error: message,
    });
}
