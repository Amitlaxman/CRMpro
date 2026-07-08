"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/health", (req, res) => {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    res.status(200).json({
        status: "UP",
        uptime: `${process.uptime().toFixed(1)}s`,
        memoryHeapUsed: `${memoryUsage.toFixed(2)} MB`,
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
        aiProviderStatus: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? "ONLINE" : "SIMULATED",
    });
});
router.get("/ready", (req, res) => {
    res.status(200).json({
        status: "READY",
    });
});
exports.default = router;
