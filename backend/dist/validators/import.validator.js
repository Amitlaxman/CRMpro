"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportValidator = void 0;
class ImportValidator {
    static validateCSV(headers, records) {
        const errors = [];
        const warnings = [];
        // 1. Check for empty headers
        if (headers.some((h) => !h || h.trim() === "")) {
            errors.push("CSV contains one or more empty header columns.");
        }
        // 2. Check for duplicate headers
        const headerCounts = {};
        headers.forEach((h) => {
            if (h) {
                headerCounts[h] = (headerCounts[h] || 0) + 1;
            }
        });
        const duplicates = Object.keys(headerCounts).filter((h) => headerCounts[h] > 1);
        if (duplicates.length > 0) {
            errors.push(`Duplicate column headers detected: ${duplicates.join(", ")}`);
        }
        // 3. Check for empty files
        if (records.length === 0) {
            errors.push("The CSV file contains no lead rows.");
        }
        // 4. Heuristic warning checks (Missing values)
        let missingValuesCount = 0;
        records.forEach((row, idx) => {
            headers.forEach((header) => {
                if (!row[header] || row[header].trim() === "") {
                    missingValuesCount++;
                }
            });
        });
        if (missingValuesCount > 0) {
            warnings.push(`CSV has ${missingValuesCount} missing cell values across records.`);
        }
        return {
            errors,
            warnings,
        };
    }
}
exports.ImportValidator = ImportValidator;
