import fs from "fs"
import csvParser from "csv-parser"

export interface CSVParseOutput {
  headers: string[]
  rowCount: number
  records: Record<string, string>[]
}

export class CSVService {
  public static parseFile(filePath: string): Promise<CSVParseOutput> {
    return new Promise((resolve, reject) => {
      const records: Record<string, string>[] = []
      let headers: string[] = []

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("headers", (headerList: string[]) => {
          headers = headerList.map((h) => h.trim())
        })
        .on("data", (row: any) => {
          // Trim keys and values to ensure clean data quality
          const cleanedRow: Record<string, string> = {}
          Object.keys(row).forEach((key) => {
            cleanedRow[key.trim()] = (row[key] || "").toString().trim()
          })
          records.push(cleanedRow)
        })
        .on("end", () => {
          resolve({
            headers,
            rowCount: records.length,
            records,
          })
        })
        .on("error", (err) => {
          reject(err)
        })
    })
  }
}
