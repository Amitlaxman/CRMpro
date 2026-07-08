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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
// Load env variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Global rate limiting to mitigate DDoS
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Intercept Request start times for exact upload timing metrics
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});
// Helmet configurations for security headers
app.use((0, helmet_1.default)());
// Whitelisted CORS policies
const whitelist = [
    "http://localhost:3000",
    "https://crmpro-importer.vercel.app",
    "https://crmpro-amitlaxman.vercel.app"
];
if (process.env.CORS_ORIGIN) {
    if (process.env.CORS_ORIGIN === "*") {
        whitelist.push("*");
    }
    else {
        whitelist.push(...process.env.CORS_ORIGIN.split(",").map((o) => o.trim()));
    }
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || whitelist.includes("*") || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Mount Monitoring & Health Check APIs
app.use("/api/status", health_routes_1.default);
// Import Routes
app.use("/api/import", import_routes_1.default);
// Global Error Catching Middleware
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
