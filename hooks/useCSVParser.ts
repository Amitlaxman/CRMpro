"use client"

import * as React from "react"
import { parseCSV, CSVParseResult } from "@/services/csvParser"
import { analyzeCSV, CSVAnalysisResult } from "@/services/csvAnalyzer"
import { toast } from "sonner"

export function useCSVParser() {
  const [file, setFile] = React.useState<File | null>(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<Record<string, string>[]>([])
  const [headers, setHeaders] = React.useState<string[]>([])
  const [analysis, setAnalysis] = React.useState<CSVAnalysisResult | null>(null)
  const [timestamp, setTimestamp] = React.useState<string>("")

  const parseAndAnalyze = React.useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setIsParsing(true)
    setParseError(null)

    try {
      const result = await parseCSV(selectedFile)
      
      if (result.errors.length > 0) {
        const firstErr = result.errors[0]
        const warnMsg = `CSV Parsed with issues: ${firstErr.message} on row ${firstErr.row}`
        toast.warning(warnMsg)
      } else {
        toast.success(`Successfully parsed ${result.data.length} rows!`)
      }

      setData(result.data)
      setHeaders(result.headers)

      // Analyze data quality & column configurations
      const analysisResult = analyzeCSV(result.data, result.headers, selectedFile.size)
      setAnalysis(analysisResult)

      // Record load timestamp
      setTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (err: any) {
      const errMsg = err?.message || "Failed to parse CSV file."
      setParseError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsParsing(false)
    }
  }, [])

  const reset = React.useCallback(() => {
    setFile(null)
    setIsParsing(false)
    setParseError(null)
    setData([])
    setHeaders([])
    setAnalysis(null)
    setTimestamp("")
  }, [])

  return {
    file,
    isParsing,
    parseError,
    data,
    headers,
    analysis,
    timestamp,
    parseAndAnalyze,
    reset,
  }
}
