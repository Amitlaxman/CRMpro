"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVService = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
class CSVService {
    static parseFile(filePath) {
        return new Promise((resolve, reject) => {
            const records = [];
            let headers = [];
            fs_1.default.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on("headers", (headerList) => {
                headers = headerList.map((h) => h.trim());
            })
                .on("data", (row) => {
                // Trim keys and values to ensure clean data quality
                const cleanedRow = {};
                Object.keys(row).forEach((key) => {
                    cleanedRow[key.trim()] = (row[key] || "").toString().trim();
                });
                records.push(cleanedRow);
            })
                .on("end", () => {
                resolve({
                    headers,
                    rowCount: records.length,
                    records,
                });
            })
                .on("error", (err) => {
                reject(err);
            });
        });
    }
}
exports.CSVService = CSVService;
