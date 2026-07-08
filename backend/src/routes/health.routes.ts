import { Router, Request, Response } from "express"

const router = Router()

router.get("/health", (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024
  res.status(200).json({
    status: "UP",
    uptime: `${process.uptime().toFixed(1)}s`,
    memoryHeapUsed: `${memoryUsage.toFixed(2)} MB`,
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    aiProviderStatus: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? "ONLINE" : "SIMULATED",
  })
})

router.get("/ready", (req: Request, res: Response) => {
  res.status(200).json({
    status: "READY",
  })
})

export default router
