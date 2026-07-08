import { Request, Response, NextFunction } from "express"
import fs from "fs"
import crypto from "crypto"
import { CSVService } from "../services/csv.service"
import { BatchService } from "../services/batch.service"
import { UploadService } from "../services/upload.service"
import { ImportValidator } from "../validators/import.validator"
import { analyzeCSV } from "../services/csvAnalyzer"
import { CacheService } from "../services/cache.service"
import { ExtractionService } from "../services/extraction.service"

export class ImportController {
  public static async uploadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startReqTime = req.startTime || Date.now()
    const parseStart = Date.now()

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No CSV file uploaded or invalid format.",
      })
      return
    }

    const { path: filePath, originalname: filename, size: filesize } = req.file

    try {
      // 1. Calculate Upload Time
      const uploadTime = parseFloat(((parseStart - startReqTime) / 1000).toFixed(3))

      // 2. CSV Hashing (SHA-256 fingerprinting)
      const fileBuffer = fs.readFileSync(filePath)
      const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex")

      // 3. Stream parse CSV
      const parsed = await CSVService.parseFile(filePath)
      const parseEnd = Date.now()
      const parseTime = parseFloat(((parseEnd - parseStart) / 1000).toFixed(3))

      // 4. Validate & Analyze Columns
      const validationStart = Date.now()
      const validation = ImportValidator.validateCSV(parsed.headers, parsed.records)
      const analysis = analyzeCSV(parsed.records, parsed.headers, filesize)
      const validationEnd = Date.now()
      const validationTime = parseFloat(((validationEnd - validationStart) / 1000).toFixed(3))

      // 5. Batch records
      const batches = BatchService.createBatches(parsed.records)

      // 6. Generate Import Request ID
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const hexSuffix = crypto.randomBytes(3).toString("hex").toUpperCase()
      const importId = `IMP-${year}${month}${day}-${hexSuffix}`

      // 7. Cache parsed structure for streaming extraction phase
      CacheService.set(importId, {
        filename,
        filesize,
        headers: parsed.headers,
        records: parsed.records,
        batches,
        timestamp: Date.now(),
      })

      // 8. Request timing calculations
      const totalTime = parseFloat(((Date.now() - startReqTime) / 1000).toFixed(3))
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024

      // Log statistics
      console.log(`[Import Service] Upload parsed for ID: ${importId}`)
      console.log(`- Upload Duration: ${uploadTime} s`)
      console.log(`- Parse Duration: ${parseTime} s`)
      console.log(`- Validation Duration: ${validationTime} s`)
      console.log(`- Total Duration: ${totalTime} s`)
      console.log(`- File Fingerprint: ${sha256}`)
      console.log(`- Heap memory used: ${memoryUsage.toFixed(2)} MB`)

      // Clean up file
      UploadService.deleteFile(filePath)

      res.status(200).json({
        success: validation.errors.length === 0,
        importId,
        sha256,
        filename,
        filesize,
        headers: parsed.headers,
        rowCount: parsed.rowCount,
        batchesCount: batches.length,
        warnings: validation.warnings,
        errors: validation.errors,
        columnsInfo: analysis.columnsInfo,
        records: parsed.records.slice(0, 100), // Return sample first 100 for frontend previews
        timings: {
          uploadTime,
          parseTime,
          validationTime,
          total: totalTime,
        },
      })
    } catch (err: any) {
      // Cleanup on fail
      UploadService.deleteFile(filePath)
      next(err)
    }
  }

  public static async streamImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { importId } = req.query

    if (!importId || typeof importId !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing or invalid query parameter: importId",
      })
      return
    }

    try {
      await ExtractionService.streamExtraction(importId, res)
    } catch (err) {
      next(err)
    }
  }
}
