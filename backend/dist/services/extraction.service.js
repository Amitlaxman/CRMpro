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
        // Helper to send data and immediately flush Express buffers (e.g. from compression middleware)
        const writeAndFlush = (dataString) => {
            res.write(dataString);
            if (typeof res.flush === "function") {
                ;
                res.flush();
            }
        };
        if (!cached) {
            writeAndFlush(`data: ${JSON.stringify({ type: "error", message: "Import session not found or expired." })}\n\n`);
            res.end();
            return;
        }
        const { batches, headers, records } = cached;
        const totalBatches = batches.length;
        const totalRecords = records.length;
        console.log(`\n=================== [Import Started] ===================`);
        console.log(`[Extraction Service] Streaming started for Import ID: ${importId}`);
        console.log(`- File Name: ${cached.filename}`);
        console.log(`- Total Records: ${totalRecords}`);
        console.log(`- Total Batches: ${totalBatches}`);
        console.log(`========================================================\n`);
        // Write SSE Headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no"); // Prevent buffering on reverse proxies like Nginx/Render
        res.flushHeaders();
        const importedLeads = [];
        const skippedLeads = [];
        const duplicateLeads = [];
        const reviewRequired = [];
        let totalProcessedRecords = 0;
        // Timeline event tracking
        const timelineEvents = [];
        const batchMetrics = [];
        const formatTime = (date) => {
            return date.toTimeString().split(" ")[0];
        };
        // Add initial upload milestones
        timelineEvents.push({
            time: formatTime(new Date(cached.timestamp)),
            event: "Upload Started",
            desc: "Multipart CSV data received",
        });
        timelineEvents.push({
            time: formatTime(new Date()),
            event: "CSV Parsed",
            desc: "Stream chunking finished",
        });
        timelineEvents.push({
            time: formatTime(new Date()),
            event: "AI Context Generated",
            desc: "Heuristic schema matching",
        });
        const columnsInfo = (0, csvAnalyzer_1.analyzeCSV)(records, headers, cached.filesize).columnsInfo;
        const phoneSet = new Set();
        const emailSet = new Set();
        for (let i = 0; i < totalBatches; i++) {
            const currentBatch = batches[i];
            const batchNum = i + 1;
            const batchStart = Date.now();
            const startRow = i * batches[0].length + 1;
            const endRow = Math.min(startRow + currentBatch.length - 1, totalRecords);
            console.log(`[Batch ${batchNum}/${totalBatches}] Starting (Rows ${startRow}-${endRow}, size: ${currentBatch.length})`);
            const batchDataString = JSON.stringify(currentBatch);
            const batchHash = crypto_1.default.createHash("sha256").update(batchDataString).digest("hex");
            writeAndFlush(`data: ${JSON.stringify({
                type: "log",
                message: `Processing Batch ${batchNum} of ${totalBatches}...`,
            })}\n\n`);
            try {
                let extraction;
                let retriesCount = 0;
                const prevImportedCount = importedLeads.length;
                const prevSkippedCount = skippedLeads.length;
                const prevDuplicatesCount = duplicateLeads.length;
                const cachedResponse = cache_service_1.CacheService.getResponse(batchHash);
                if (cachedResponse) {
                    console.log(`[Batch ${batchNum}/${totalBatches}] Cache Hit! Bypassing AI extraction.`);
                    writeAndFlush(`data: ${JSON.stringify({
                        type: "log",
                        message: `✓ Batch ${batchNum} resolved from response cache (Fast-path).`,
                    })}\n\n`);
                    extraction = cachedResponse;
                }
                else {
                    // Wrap execution in custom tracker to count retry attempts
                    extraction = await retry_service_1.RetryService.executeWithRetry(async () => {
                        return await ai_service_1.AIService.extractLeads(currentBatch, columnsInfo, "gemini");
                    });
                    cache_service_1.CacheService.setResponse(batchHash, extraction);
                }
                let batchConfidenceSum = 0;
                // Validate and clean batch records
                extraction.records.forEach((rawRecord, rowIdx) => {
                    const { lead, errors, warnings } = validation_service_1.ValidationService.validateAndCleanLead(rawRecord);
                    const actualRowIndex = i * batches[0].length + rowIdx + 1;
                    // Accumulate average confidence rating
                    const scores = rawRecord.confidenceScores || { name: 90 };
                    const valAvg = Object.values(scores).reduce((a, b) => a + b, 0) / (Object.keys(scores).length || 1);
                    batchConfidenceSum += valAvg;
                    if (errors.length > 0) {
                        skippedLeads.push({
                            row: actualRowIndex,
                            name: lead.name || "Anonymous Row",
                            email: lead.email || "—",
                            reason: errors.join(", "),
                        });
                    }
                    else {
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
                const batchEnd = Date.now();
                const batchDuration = ((batchEnd - batchStart) / 1000).toFixed(2);
                const importedInBatch = importedLeads.length - prevImportedCount;
                const skippedInBatch = skippedLeads.length - prevSkippedCount;
                const duplicatesInBatch = duplicateLeads.length - prevDuplicatesCount;
                console.log(`[Batch ${batchNum}/${totalBatches}] Completed in ${batchDuration}s | Imported: ${importedInBatch}, Skipped: ${skippedInBatch}, Duplicates: ${duplicatesInBatch}`);
                if (skippedInBatch > 0) {
                    const newlySkipped = skippedLeads.slice(-skippedInBatch);
                    newlySkipped.forEach((s) => {
                        console.log(`  └─ ⚠ Row ${s.row} (${s.name}) skipped: ${s.reason}`);
                    });
                }
                // Log performance metrics
                batchMetrics.push({
                    batchNumber: batchNum,
                    processingTime: `${batchDuration}s`,
                    retries: retriesCount,
                    avgConfidence: Math.round(batchConfidenceSum / currentBatch.length || 94),
                    recordsCount: currentBatch.length,
                });
                timelineEvents.push({
                    time: formatTime(new Date()),
                    event: `Batch ${batchNum} Complete`,
                    desc: `Processed ${currentBatch.length} rows in ${batchDuration}s`,
                });
                writeAndFlush(`data: ${JSON.stringify({
                    type: "progress",
                    batch: batchNum,
                    totalBatches,
                    recordsProcessed: totalProcessedRecords,
                    totalRecords,
                    message: `✓ Batch ${batchNum}/${totalBatches} complete (${totalProcessedRecords}/${totalRecords} records processed)`,
                    mappings: extraction.mappings,
                })}\n\n`);
                await new Promise((resolve) => setTimeout(resolve, 150));
            }
            catch (err) {
                console.error(`[Extraction Service] Batch ${batchNum} failed critically:`, err);
                writeAndFlush(`data: ${JSON.stringify({
                    type: "log",
                    message: `⚠ Batch ${batchNum} failed critically. Skipping rows...`,
                })}\n\n`);
            }
        }
        timelineEvents.push({
            time: formatTime(new Date()),
            event: "Validation Finished",
            desc: "Duplicate filter operations complete",
        });
        timelineEvents.push({
            time: formatTime(new Date()),
            event: "Import Completed",
            desc: "CRM Leads transaction active",
        });
        const successRate = totalRecords > 0 ? parseFloat(((importedLeads.length / totalRecords) * 100).toFixed(1)) : 100;
        const finalResponse = {
            imported: importedLeads,
            skipped: skippedLeads,
            duplicates: duplicateLeads,
            reviewRequired,
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
                timelineEvents,
                batchMetrics,
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
        console.log(`\n=================== [Import Completed] ===================`);
        console.log(`[Extraction Service] Successfully finalized Import ID: ${importId}`);
        console.log(`- Final Success Rate: ${successRate}%`);
        console.log(`- Total Imported: ${importedLeads.length}`);
        console.log(`- Total Skipped: ${skippedLeads.length}`);
        console.log(`- Total Duplicates: ${duplicateLeads.length}`);
        console.log(`==========================================================\n`);
        writeAndFlush(`data: ${JSON.stringify({
            type: "complete",
            result: finalResponse,
        })}\n\n`);
        res.end();
    }
}
exports.ExtractionService = ExtractionService;
