export interface ColumnInfo {
  name: string
  nonEmptyCount: number
  completeness: number
  likelyType?: "Name" | "Email" | "Phone" | "Company" | "City" | "Country" | "State"
}

export interface CSVAnalysisResult {
  totalRows: number
  totalColumns: number
  emptyRowsCount: number
  duplicateHeaders: string[]
  rowsWithMissingValuesCount: number
  estimatedFileSize: number
  columnsInfo: ColumnInfo[]
  warnings: string[]
}

const ALIASES: Record<string, string[]> = {
  Name: ["name", "customer", "client", "prospect", "full_name", "first_name", "last_name", "lead_name"],
  Email: ["email", "mail", "email_address", "emailaddr", "email_addr"],
  Phone: ["phone", "mobile", "contact", "whatsapp", "cell", "telephone", "phone_number", "phone_no"],
  Company: ["company", "organization", "org", "company_name", "employer"],
  City: ["city", "town", "location"],
  Country: ["country", "nation"],
  State: ["state", "province", "region"],
}

export function analyzeCSV(
  data: Record<string, string>[],
  headers: string[],
  fileSize: number
): CSVAnalysisResult {
  const totalRows = data.length
  const totalColumns = headers.length
  let rowsWithMissingValuesCount = 0
  let emptyRowsCount = 0

  // Find duplicate headers
  const headerCounts: Record<string, number> = {}
  headers.forEach((h) => {
    headerCounts[h] = (headerCounts[h] || 0) + 1
  })
  const duplicateHeaders = Object.keys(headerCounts).filter((h) => headerCounts[h] > 1)

  // Initialize column calculations
  const colNonEmptyCounts: Record<string, number> = {}
  headers.forEach((h) => {
    colNonEmptyCounts[h] = 0
  })

  // Scan rows for quality details
  const warnings: string[] = []
  
  if (duplicateHeaders.length > 0) {
    warnings.push(`Duplicate column headers detected: ${duplicateHeaders.join(", ")}`)
  }
  if (headers.some((h) => h === "")) {
    warnings.push("One or more column headers are empty.")
  }

  let textLengthWarningTriggered = false

  data.forEach((row, rowIdx) => {
    let hasMissing = false
    let isRowEmpty = true

    headers.forEach((header) => {
      const val = (row[header] || "").toString().trim()
      if (val !== "") {
        colNonEmptyCounts[header]++
        isRowEmpty = false
      } else {
        hasMissing = true
      }

      // Check for extremely long text (> 200 chars)
      if (val.length > 200 && !textLengthWarningTriggered) {
        warnings.push(`Extremely long text detected in row ${rowIdx + 1}.`)
        textLengthWarningTriggered = true
      }
    })

    if (isRowEmpty) {
      emptyRowsCount++
    }
    if (hasMissing) {
      rowsWithMissingValuesCount++
    }
  })

  if (emptyRowsCount > 0) {
    warnings.push(`${emptyRowsCount} completely empty rows detected.`)
  }

  // Generate column completeness & match heuristics
  const columnsInfo: ColumnInfo[] = headers.map((header) => {
    const normHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "")
    let likelyType: ColumnInfo["likelyType"] = undefined

    // Check alias mappings
    for (const [type, list] of Object.entries(ALIASES)) {
      if (list.some((alias) => normHeader.includes(alias.replace(/[^a-z0-9]/g, "")))) {
        likelyType = type as ColumnInfo["likelyType"]
        break
      }
    }

    const nonEmptyCount = colNonEmptyCounts[header] || 0
    const completeness = totalRows > 0 ? Math.round((nonEmptyCount / totalRows) * 100) : 0

    return {
      name: header,
      nonEmptyCount,
      completeness,
      likelyType,
    }
  })

  return {
    totalRows,
    totalColumns,
    emptyRowsCount,
    duplicateHeaders,
    rowsWithMissingValuesCount,
    estimatedFileSize: fileSize,
    columnsInfo,
    warnings,
  }
}
