import { z } from "zod"
import dotenv from "dotenv"

// Ensure env variables are loaded
dotenv.config()

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  MAX_FILE_SIZE: z.string().default("26214400").transform((val) => parseInt(val, 10)),
  MAX_BATCH_SIZE: z.string().default("25").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
})

export function validateEnv(): void {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error("❌ Environment validation failed:", result.error.format())
    process.exit(1)
  }
  console.log("✓ Environment configurations validated successfully.")
}
