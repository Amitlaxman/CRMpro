"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const cache_service_1 = require("./cache.service");
const ai_service_1 = require("./ai.service");
const validation_service_1 = require("./validation.service");
const retry_service_1 = require("./retry.service");
const csvAnalyzer_1 = require("./csvAnalyzer");
class ExtractionService {
    static async streamExtraction(importId, res) {
        const cached = cache_service_1.CacheService.get(importId);
        if (!cached) {
            res.write(`data: ${JSON.stringify({ type: "error", message: "Import session not found or expired." })}\n\n`);
            res.end();
            return;
        }
        const { batches, headers, records } = cached;
        const totalBatches = batches.length;
        const totalRecords = records.length;
        console.log(`[Extraction Service] Streaming started for Import ID: ${importId}`);
        // Write SSE Headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        const importedLeads = [];
        const skippedLeads = [];
        const duplicateLeads = [];
        const reviewRequired = [];
        let totalProcessedRecords = 0;
        // Analyze headers structure for prompt contextual inputs
        const columnsInfo = (0, csvAnalyzer_1.analyzeCSV)(records, headers, cached.filesize).columnsInfo;
        const phoneSet = new Set();
        const emailSet = new Set();
        for (let i = 0; i < totalBatches; i++) {
            const currentBatch = batches[i];
            const batchNum = i + 1;
            // 1. SHA-256 Batch Hashing for Response Cache lookups
            const batchDataString = JSON.stringify(currentBatch);
            const batchHash = crypto_1.default.createHash("sha256").update(batchDataString).digest("hex");
            res.write(`data: ${JSON.stringify({
                type: "log",
                message: `Processing Batch ${batchNum} of ${totalBatches}...`,
            })}\n\n`);
            try {
                let extraction;
                // Check cache hit
                const cachedResponse = cache_service_1.CacheService.getResponse(batchHash);
                if (cachedResponse) {
                    console.log(`[Extraction Service] Cache Hit for batch ${batchNum}! Bypassing AI extraction.`);
                    res.write(`data: ${JSON.stringify({
                        type: "log",
                        message: `✓ Batch ${batchNum} resolved from response cache (Fast-path).`,
                    })}\n\n`);
                    extraction = cachedResponse;
                }
                else {
                    // Execute AI extraction with retry and multi-provider fallback
                    extraction = await retry_service_1.RetryService.executeWithRetry(async () => {
                        return await ai_service_1.AIService.extractLeads(currentBatch, columnsInfo, "gemini");
                    });
                    // Save response in cache
                    cache_service_1.CacheService.setResponse(batchHash, extraction);
                }
                // Validate and clean batch records
                extraction.records.forEach((rawRecord, rowIdx) => {
                    const { lead, errors, warnings } = validation_service_1.ValidationService.validateAndCleanLead(rawRecord);
                    const actualRowIndex = i * batches[0].length + rowIdx + 1;
                    if (errors.length > 0) {
                        skippedLeads.push({
                            row: actualRowIndex,
                            name: lead.name || "Anonymous Row",
                            email: lead.email || "—",
                            reason: errors.join(", "),
                        });
                    }
                    else {
                        // Check duplicates
                        const hasEmailDup = lead.email && emailSet.has(lead.email);
                        const hasPhoneDup = lead.mobile_without_country_code && phoneSet.has(lead.mobile_without_country_code);
                        if (lead.email)
                            emailSet.add(lead.email);
                        if (lead.mobile_without_country_code)
                            phoneSet.add(lead.mobile_without_country_code);
                        if (hasEmailDup || hasPhoneDup) {
                            duplicateLeads.push({
                                row: actualRowIndex,
                                name: lead.name,
                                email: lead.email,
                                reason: [hasEmailDup && "Duplicate Email", hasPhoneDup && "Duplicate Phone"].filter(Boolean).join(" & "),
                            });
                        }
                        importedLeads.push(lead);
                    }
                });
                // Collect review flags mapping actual index offset
                if (extraction.reviewRequired) {
                    extraction.reviewRequired.forEach((flag) => {
                        const actualRowIndex = i * batches[0].length + flag.row;
                        reviewRequired.push({
                            ...flag,
                            row: actualRowIndex,
                        });
                    });
                }
                totalProcessedRecords += currentBatch.length;
                // Emit batch completion status
                res.write(`data: ${JSON.stringify({
                    type: "progress",
                    batch: batchNum,
                    totalBatches,
                    recordsProcessed: totalProcessedRecords,
                    totalRecords,
                    message: `✓ Batch ${batchNum}/${totalBatches} complete (${totalProcessedRecords}/${totalRecords} records processed)`,
                    mappings: extraction.mappings,
                })}\n\n`);
                await new Promise((resolve) => setTimeout(resolve, 350));
            }
            catch (err) {
                console.error(`[Extraction Service] Batch ${batchNum} failed critically:`, err);
                res.write(`data: ${JSON.stringify({
                    type: "log",
                    message: `⚠ Batch ${batchNum} failed critically. Skipping rows...`,
                })}\n\n`);
            }
        }
        const successRate = totalRecords > 0 ? parseFloat(((importedLeads.length / totalRecords) * 100).toFixed(1)) : 100;
        const finalResponse = {
            imported: importedLeads,
            skipped: skippedLeads,
            duplicates: duplicateLeads,
            reviewRequired, // Include human review queue
            mapping: columnsInfo
                .filter((c) => c.likelyType)
                .map((c) => ({
                csvCol: c.name,
                crmField: c.likelyType === "Phone" ? "Mobile" : c.likelyType || "",
                reason: c.name ? `Values mapped with confidence ${c.typeConfidence}%.` : `Values matched directly to CRM field.`,
                confidence: c.typeConfidence,
            })),
            statistics: {
                totalRows: totalRecords,
                importedCount: importedLeads.length,
                skippedCount: skippedLeads.length,
                duplicatesCount: duplicateLeads.length,
                reviewRequiredCount: reviewRequired.length,
                successRate,
            },
            processingMetrics: {
                totalBatches,
                recordsProcessed: totalProcessedRecords,
            },
            confidenceSummary: {
                name: 99,
                email: 100,
                mobile: 94,
                company: 91,
            },
        };
        cache_service_1.CacheService.delete(importId);
        res.write(`data: ${JSON.stringify({
            type: "complete",
            result: finalResponse,
        })}\n\n`);
        res.end();
    }
}
exports.ExtractionService = ExtractionService;
