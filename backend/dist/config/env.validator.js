"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure env variables are loaded
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default("5000").transform((val) => parseInt(val, 10)),
    MAX_FILE_SIZE: zod_1.z.string().default("26214400").transform((val) => parseInt(val, 10)),
    MAX_BATCH_SIZE: zod_1.z.string().default("25").transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(["development", "staging", "production"]).default("development"),
});
function validateEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Environment validation failed:", result.error.format());
        process.exit(1);
    }
    console.log("✓ Environment configurations validated successfully.");
}
