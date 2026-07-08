"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const csv_service_1 = require("../services/csv.service");
const batch_service_1 = require("../services/batch.service");
const upload_service_1 = require("../services/upload.service");
const import_validator_1 = require("../validators/import.validator");
const csvAnalyzer_1 = require("../services/csvAnalyzer");
const cache_service_1 = require("../services/cache.service");
const extraction_service_1 = require("../services/extraction.service");
class ImportController {
    static async uploadCSV(req, res, next) {
        const startReqTime = req.startTime || Date.now();
        const parseStart = Date.now();
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: "No CSV file uploaded or invalid format.",
            });
            return;
        }
        const { path: filePath, originalname: filename, size: filesize } = req.file;
        try {
            // 1. Calculate Upload Time
            const uploadTime = parseFloat(((parseStart - startReqTime) / 1000).toFixed(3));
            // 2. CSV Hashing (SHA-256 fingerprinting)
            const fileBuffer = fs_1.default.readFileSync(filePath);
            const sha256 = crypto_1.default.createHash("sha256").update(fileBuffer).digest("hex");
            // 3. Stream parse CSV
            const parsed = await csv_service_1.CSVService.parseFile(filePath);
            const parseEnd = Date.now();
            const parseTime = parseFloat(((parseEnd - parseStart) / 1000).toFixed(3));
            // 4. Validate & Analyze Columns
            const validationStart = Date.now();
            const validation = import_validator_1.ImportValidator.validateCSV(parsed.headers, parsed.records);
            const analysis = (0, csvAnalyzer_1.analyzeCSV)(parsed.records, parsed.headers, filesize);
            const validationEnd = Date.now();
            const validationTime = parseFloat(((validationEnd - validationStart) / 1000).toFixed(3));
            // 5. Batch records
            const batches = batch_service_1.BatchService.createBatches(parsed.records);
            // 6. Generate Import Request ID
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const hexSuffix = crypto_1.default.randomBytes(3).toString("hex").toUpperCase();
            const importId = `IMP-${year}${month}${day}-${hexSuffix}`;
            // 7. Cache parsed structure for streaming extraction phase
            cache_service_1.CacheService.set(importId, {
                filename,
                filesize,
                headers: parsed.headers,
                records: parsed.records,
                batches,
                timestamp: Date.now(),
            });
            // 8. Request timing calculations
            const totalTime = parseFloat(((Date.now() - startReqTime) / 1000).toFixed(3));
            const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            // Log statistics
            console.log(`[Import Service] Upload parsed for ID: ${importId}`);
            console.log(`- Upload Duration: ${uploadTime} s`);
            console.log(`- Parse Duration: ${parseTime} s`);
            console.log(`- Validation Duration: ${validationTime} s`);
            console.log(`- Total Duration: ${totalTime} s`);
            console.log(`- File Fingerprint: ${sha256}`);
            console.log(`- Heap memory used: ${memoryUsage.toFixed(2)} MB`);
            // Clean up file
            upload_service_1.UploadService.deleteFile(filePath);
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
            });
        }
        catch (err) {
            // Cleanup on fail
            upload_service_1.UploadService.deleteFile(filePath);
            next(err);
        }
    }
    static async streamImport(req, res, next) {
        const { importId } = req.query;
        if (!importId || typeof importId !== "string") {
            res.status(400).json({
                success: false,
                error: "Missing or invalid query parameter: importId",
            });
            return;
        }
        try {
            await extraction_service_1.ExtractionService.streamExtraction(importId, res);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ImportController = ImportController;
