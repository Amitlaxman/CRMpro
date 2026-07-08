"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCSV = analyzeCSV;
const ALIASES = {
    Name: ["name", "customer", "client", "prospect", "full_name", "first_name", "last_name", "lead_name"],
    Email: ["email", "mail", "email_address", "emailaddr", "email_addr"],
    Phone: ["phone", "mobile", "contact", "whatsapp", "cell", "telephone", "phone_number", "phone_no"],
    Company: ["company", "organization", "org", "company_name", "employer"],
    City: ["city", "town", "location"],
    Country: ["country", "nation"],
    State: ["state", "province", "region"],
};
function analyzeCSV(data, headers, fileSize) {
    const totalRows = data.length;
    const totalColumns = headers.length;
    let rowsWithMissingValuesCount = 0;
    let emptyRowsCount = 0;
    const headerCounts = {};
    headers.forEach((h) => {
        headerCounts[h] = (headerCounts[h] || 0) + 1;
    });
    const duplicateHeaders = Object.keys(headerCounts).filter((h) => headerCounts[h] > 1);
    const colNonEmptyCounts = {};
    const colUniqueSets = {};
    const colExamples = {};
    headers.forEach((h) => {
        colNonEmptyCounts[h] = 0;
        colUniqueSets[h] = new Set();
        colExamples[h] = "";
    });
    const warnings = [];
    if (duplicateHeaders.length > 0) {
        warnings.push(`Duplicate column headers detected: ${duplicateHeaders.join(", ")}`);
    }
    if (headers.some((h) => h === "")) {
        warnings.push("One or more column headers are empty.");
    }
    let textLengthWarningTriggered = false;
    data.forEach((row, rowIdx) => {
        let hasMissing = false;
        let isRowEmpty = true;
        headers.forEach((header) => {
            const val = (row[header] || "").toString().trim();
            if (val !== "") {
                colNonEmptyCounts[header]++;
                colUniqueSets[header].add(val);
                isRowEmpty = false;
                if (!colExamples[header]) {
                    colExamples[header] = val;
                }
            }
            else {
                hasMissing = true;
            }
            if (val.length > 200 && !textLengthWarningTriggered) {
                warnings.push(`Extremely long text detected in row ${rowIdx + 1}.`);
                textLengthWarningTriggered = true;
            }
        });
        if (isRowEmpty) {
            emptyRowsCount++;
        }
        if (hasMissing) {
            rowsWithMissingValuesCount++;
        }
    });
    if (emptyRowsCount > 0) {
        warnings.push(`${emptyRowsCount} completely empty rows detected.`);
    }
    // Column profiling: header matching + value scanning
    const columnsInfo = headers.map((header) => {
        const normHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nonEmptyCount = colNonEmptyCounts[header] || 0;
        const completeness = totalRows > 0 ? Math.round((nonEmptyCount / totalRows) * 100) : 0;
        const uniqueValuesCount = colUniqueSets[header]?.size || 0;
        const exampleValue = colExamples[header] || "—";
        // Heuristics Score calculation
        let bestType = undefined;
        let bestScore = 0;
        // Email Pattern Heuristic
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Phone Pattern Heuristic
        const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
        // Scan up to 50 sample values to check type matching rates
        const samples = Array.from(colUniqueSets[header] || []).slice(0, 50);
        let emailMatches = 0;
        let phoneMatches = 0;
        let nameMatches = 0;
        samples.forEach((val) => {
            if (emailRegex.test(val))
                emailMatches++;
            else if (phoneRegex.test(val) && val.replace(/\D/g, "").length >= 7)
                phoneMatches++;
            else if (val.split(" ").length >= 2 && /^[a-zA-Z\s]+$/.test(val))
                nameMatches++;
        });
        const emailSampleRate = samples.length > 0 ? emailMatches / samples.length : 0;
        const phoneSampleRate = samples.length > 0 ? phoneMatches / samples.length : 0;
        const nameSampleRate = samples.length > 0 ? nameMatches / samples.length : 0;
        // Evaluate score for each schema type
        for (const [type, list] of Object.entries(ALIASES)) {
            // Header Confidence Score (0% to 100%)
            let headerConf = 0;
            if (list.some((alias) => normHeader.includes(alias.replace(/[^a-z0-9]/g, "")))) {
                headerConf = 75;
            }
            // Sample Value Confidence Score (0% to 100%)
            let sampleConf = 0;
            if (type === "Email")
                sampleConf = emailSampleRate * 100;
            else if (type === "Phone")
                sampleConf = phoneSampleRate * 100;
            else if (type === "Name")
                sampleConf = nameSampleRate * 100;
            else if (type === "Company" && !bestType) {
                // Fallback checks
                sampleConf = normHeader.includes("company") || normHeader.includes("org") ? 50 : 0;
            }
            // Weighted sum: 30% header name + 70% sample value matches
            const combinedScore = Math.round(headerConf * 0.3 + sampleConf * 0.7);
            if (combinedScore > bestScore && combinedScore > 30) {
                bestScore = combinedScore;
                bestType = type;
            }
        }
        return {
            name: header,
            nonEmptyCount,
            completeness,
            likelyType: bestType,
            typeConfidence: bestScore || 100, // Default to 100 if simple string
            uniqueValuesCount,
            exampleValue,
        };
    });
    return {
        totalRows,
        totalColumns,
        emptyRowsCount,
        duplicateHeaders,
        rowsWithMissingValuesCount,
        estimatedFileSize: fileSize,
        columnsInfo,
        warnings,
    };
}
