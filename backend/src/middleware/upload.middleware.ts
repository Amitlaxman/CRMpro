import multer from "multer"
import path from "path"
import { Request } from "express"
import { UploadService } from "../services/upload.service"

// Ensure folder exists
UploadService.ensureUploadDirectoryExists()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext !== ".csv") {
    return cb(new Error("Only CSV files are allowed."))
  }
  cb(null, true)
}

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || "26214400", 10)

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
})
