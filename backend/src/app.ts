import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
import importRoutes from "./routes/import.routes"
import healthRoutes from "./routes/health.routes"
import { errorMiddleware } from "./middleware/error.middleware"

// Load env variables
dotenv.config()

const app = express()

// Global rate limiting to mitigate DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Intercept Request start times for exact upload timing metrics
app.use((req, res, next) => {
  req.startTime = Date.now()
  next()
})

// Helmet configurations for security headers
app.use(helmet())

// Whitelisted CORS policies
const whitelist = ["http://localhost:3000", "https://crmpro-importer.vercel.app"]
if (process.env.CORS_ORIGIN) {
  if (process.env.CORS_ORIGIN === "*") {
    whitelist.push("*")
  } else {
    whitelist.push(...process.env.CORS_ORIGIN.split(",").map((o) => o.trim()))
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes("*") || whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error("Blocked by CORS policy"))
      }
    },
  })
)

app.use(compression())
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount Monitoring & Health Check APIs
app.use("/api/status", healthRoutes)

// Import Routes
app.use("/api/import", importRoutes)

// Global Error Catching Middleware
app.use(errorMiddleware)

export default app
