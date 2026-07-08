import { Router } from "express"
import { uploadMiddleware } from "../middleware/upload.middleware"
import { ImportController } from "../controllers/import.controller"

const router = Router()

router.post("/upload", uploadMiddleware.single("file"), ImportController.uploadCSV)
router.get("/stream", ImportController.streamImport)

export default router
