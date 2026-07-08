"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
// Load env variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Intercept Request start times for exact upload timing metrics
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});
// Standard Production Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use("/api/import", import_routes_1.default);
// Global Error Catching Middleware
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
