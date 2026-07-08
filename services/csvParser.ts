import Papa from "papaparse"

export interface CSVParseResult {
  data: Record<string, string>[]
  headers: string[]
  errors: Papa.ParseError[]
  meta: Papa.ParseMeta
}

export function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve({
          data: results.data,
          headers: results.meta.fields || [],
          errors: results.errors,
          meta: results.meta,
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
