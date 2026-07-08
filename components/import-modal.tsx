"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Download, Loader2, CheckCircle2, ChevronRight, BarChart, Database, Sparkles, Clock, Zap } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Parser & Hooks
import { useCSVParser } from "@/hooks/useCSVParser"
import { useSearch } from "@/hooks/useSearch"

// Custom Components
import { SummaryCards } from "./summary-cards"
import { SearchBar } from "./search-bar"
import { ColumnInspector } from "./column-inspector"
import { DataQualityCard } from "./data-quality-card"
import { PreviewTable } from "./preview-table"
import { DetectedStructure } from "./detected-structure"

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmImport: (
    importedData: any[],
    mappingLogs: any[],
    fileName: string,
    duplicates: any[],
    skipped: any[],
    statistics: any,
    confidenceSummary: any
  ) => void
}

type UploadState = "idle" | "uploading" | "processing" | "done"

export function ImportModal({ isOpen, onClose, onConfirmImport }: ImportModalProps) {
  const {
    file,
    isParsing,
    parseError,
    data,
    headers,
    analysis,
    timestamp,
    parseAndAnalyze,
    reset,
  } = useCSVParser()

  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedColumn, setSelectedColumn] = React.useState<string | null>(null)
  
  // Backend states
  const [uploadState, setUploadState] = React.useState<UploadState>("idle")
  const [progressLogs, setProgressLogs] = React.useState<string[]>([])
  
  // Progress Counters
  const [currentBatch, setCurrentBatch] = React.useState(0)
  const [totalBatches, setTotalBatches] = React.useState(0)
  const [processedRecords, setProcessedRecords] = React.useState(0)
  const [totalRecords, setTotalRecords] = React.useState(0)
  
  // Timer States
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // API upload outputs
  const [importId, setImportId] = React.useState("")
  const [sha256, setSha256] = React.useState("")
  const [timings, setTimings] = React.useState<any>(null)
  
  // Final parsed records cached to pass to parent
  const [finalData, setFinalData] = React.useState<any>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter parsed data based on search input
  const filteredData = useSearch(data, searchTerm)

  // Handle Drag & Drop active states
  const [dragActive, setDragActive] = React.useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.toLowerCase().endsWith(".csv")) {
        parseAndAnalyze(droppedFile)
      } else {
        toast.error("Only CSV files are supported.")
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      parseAndAnalyze(selectedFile)
    }
  }

  // Timer Effect
  React.useEffect(() => {
    if (uploadState === "processing") {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [uploadState])

  const handleConfirm = async () => {
    if (!file) return

    setUploadState("uploading")
    setProgressLogs(["Uploading CSV file to backend..."])

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://localhost:5000/api/import/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success !== false) {
        setImportId(result.importId)
        setSha256(result.sha256)
        setTimings(result.timings)
        setTotalBatches(result.batchesCount)
        setTotalRecords(result.rowCount)
        
        // Start streaming AI processing EventSource
        startAIStream(result.importId)
      } else {
        const errMsg = result.error || "Failed to process CSV file."
        toast.error(errMsg)
        setUploadState("idle")
      }
    } catch (err) {
      toast.error("Network error connecting to backend.")
      setUploadState("idle")
    }
  }

  const startAIStream = (id: string) => {
    setUploadState("processing")
    setProgressLogs([
      "Parsing CSV ✓",
      "Detecting Structure ✓",
      "Building AI Context ✓",
    ])

    const eventSource = new EventSource(`http://localhost:5000/api/import/stream?importId=${id}`)

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)

        if (payload.type === "log") {
          setProgressLogs((prev) => [...prev, payload.message])
        } else if (payload.type === "progress") {
          setCurrentBatch(payload.batch)
          setProcessedRecords(payload.recordsProcessed)
          setProgressLogs((prev) => [...prev, payload.message])
        } else if (payload.type === "complete") {
          eventSource.close()
          setFinalData(payload.result)
          setUploadState("done")
          toast.success("AI Import complete!")
        } else if (payload.type === "error") {
          eventSource.close()
          toast.error(payload.message)
          setUploadState("idle")
        }
      } catch (err) {
        console.error("Failed to parse SSE payload", err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      toast.error("Stream connection closed unexpectedly.")
      setUploadState("idle")
    }
  }

  const handleFinalize = () => {
    if (!finalData) return
    onConfirmImport(
      finalData.imported,
      finalData.mapping,
      file?.name || "leads.csv",
      finalData.duplicates,
      finalData.skipped,
      finalData.statistics,
      finalData.confidenceSummary
    )
    handleModalClose()
  }

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Customer Name,Email,Contact Number,Organization,City,Remarks\nJohn Doe,john@example.com,+15550192,Acme Corp,San Francisco,Interests in enterprise CRM\nSarah Connor,sarah.c@gmail.com,+15550149,Cyberdyne Systems,Austin,Urgent follow up required\nMichael Scott,mscott@dundermifflin.com,+15550174,Dunder Mifflin,Scranton,Requires call routing"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "crmpro_leads_sample.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.info("Sample CSV downloaded.")
  }

  const handleReplace = () => {
    reset()
    setSearchTerm("")
    setSelectedColumn(null)
    setUploadState("idle")
    setImportId("")
    setSha256("")
    setTimings(null)
    setFinalData(null)
    setCurrentBatch(0)
    setProcessedRecords(0)
    setProgressLogs([])
    setTimeout(() => {
      inputRef.current?.click()
    }, 100)
  }

  const handleModalClose = () => {
    reset()
    setSearchTerm("")
    setSelectedColumn(null)
    setUploadState("idle")
    setImportId("")
    setSha256("")
    setTimings(null)
    setFinalData(null)
    setCurrentBatch(0)
    setProcessedRecords(0)
    setProgressLogs([])
    onClose()
  }

  // Calculate speed and ETA
  const recordSpeed = elapsedSeconds > 0 ? Math.round(processedRecords / elapsedSeconds) : 0
  const remainingRecords = totalRecords - processedRecords
  const etaSeconds = recordSpeed > 0 ? Math.ceil(remainingRecords / recordSpeed) : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-[980px] bg-white dark:bg-[#121214] rounded-2xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden border border-border dark:border-[#2E2E33]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-8 py-5 border-b border-border dark:border-[#2E2E33] shrink-0">
              <div className="flex flex-col gap-1 text-left">
                <h3 className="text-xl font-bold text-foreground">Import Leads via CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to bulk import leads into your system.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={uploadState === "uploading" || uploadState === "processing"}
                onClick={handleModalClose}
                className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-lg hover:bg-muted dark:hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleChange}
              />

              {isParsing ? (
                /* Loading Skeleton and parsing indicators */
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4 animate-pulse">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
                    <Loader2 className="w-12 h-12 text-primary animate-spin relative" />
                  </div>
                  <h4 className="font-bold text-base text-foreground mt-2">
                    Parsing CSV database...
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Please wait while we perform heuristic quality checks and analyze fields locally in your browser.
                  </p>
                </div>
              ) : uploadState === "uploading" ? (
                /* Uploading screen */
                <div className="flex flex-col items-center justify-center min-h-[380px] text-center gap-6 max-w-md mx-auto">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <h4 className="font-bold text-base text-foreground">Uploading CSV file...</h4>
                </div>
              ) : uploadState === "processing" ? (
                /* AI Streaming Processing dashboard */
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-6 max-w-xl mx-auto animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125 animate-pulse" />
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-primary relative">
                      <Sparkles className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-lg text-foreground">AI CSV Extraction Pipeline</h4>
                    <p className="text-xs text-muted-foreground">
                      Streaming records to validation and normalization services.
                    </p>
                  </div>

                  {/* Progressive Bar */}
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                      <span>Batch {currentBatch} of {totalBatches}</span>
                      <span>{totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${totalRecords > 0 ? (processedRecords / totalRecords) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Timing stats columns */}
                  <div className="grid grid-cols-3 gap-4 w-full text-left text-xs font-semibold">
                    <div className="flex flex-col p-3 bg-muted/40 dark:bg-zinc-900/40 border border-border dark:border-zinc-800 rounded-xl">
                      <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        Elapsed Time
                      </span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{elapsedSeconds}s</span>
                    </div>
                    <div className="flex flex-col p-3 bg-muted/40 dark:bg-zinc-900/40 border border-border dark:border-zinc-800 rounded-xl">
                      <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        Remaining (ETA)
                      </span>
                      <span className="text-sm font-bold text-foreground mt-0.5">
                        {recordSpeed > 0 ? `${etaSeconds}s` : "Calculating..."}
                      </span>
                    </div>
                    <div className="flex flex-col p-3 bg-muted/40 dark:bg-zinc-900/40 border border-border dark:border-zinc-800 rounded-xl">
                      <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                        Speed rate
                      </span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{recordSpeed} rec/s</span>
                    </div>
                  </div>

                  {/* Streaming Terminal Log console */}
                  <div className="w-full bg-zinc-950 text-zinc-300 font-mono text-xs p-4 rounded-xl text-left flex flex-col gap-2 h-[150px] overflow-y-auto shadow-inner scrollbar-thin">
                    {progressLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {log.startsWith("✓") ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />
                        )}
                        <span className="truncate">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : uploadState === "done" && finalData ? (
                /* Success processing summary screen */
                <div className="flex flex-col items-center justify-center min-h-[380px] text-center gap-5 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xl text-foreground">✓ Upload Successful</h4>
                    <p className="text-sm text-muted-foreground">
                      Leads processed and validated by the backend.
                    </p>
                  </div>

                  {/* Import ID and SHA256 */}
                  <div className="w-full flex flex-col gap-2.5 p-4 bg-muted/40 dark:bg-zinc-900/50 border border-border dark:border-zinc-800 rounded-xl text-left text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Import ID:</span>
                      <span className="font-mono font-bold text-primary">{importId}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border dark:border-zinc-800 pt-2">
                      <span className="text-muted-foreground font-semibold">File Hash (SHA-256):</span>
                      <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[280px]" title={sha256}>
                        {sha256}
                      </span>
                    </div>
                  </div>

                  {/* Processing Metrics Timing breakdown */}
                  {timings && (
                    <div className="w-full border border-border dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 rounded-xl text-left space-y-3">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart className="w-3.5 h-3.5 text-primary" />
                        Processing Metrics
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Upload Time</span>
                          <span className="text-sm font-bold text-foreground">{timings.uploadTime} s</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Parse Time</span>
                          <span className="text-sm font-bold text-foreground">{timings.parseTime} s</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Validation Time</span>
                          <span className="text-sm font-bold text-foreground">{timings.validationTime} s</span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l border-border dark:border-zinc-800 pl-4">
                          <span className="text-primary font-bold">Total Duration</span>
                          <span className="text-sm font-bold text-primary">{timings.total} s</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Human Review Queue Required */}
                  {finalData.reviewRequired && finalData.reviewRequired.length > 0 && (
                    <div className="w-full border border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/10 p-4 rounded-xl text-left space-y-2">
                      <h5 className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Human Review Queue Required ({finalData.reviewRequired.length} fields)
                      </h5>
                      <div className="max-h-[140px] overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
                        {finalData.reviewRequired.map((item: any, index: number) => (
                          <div key={index} className="text-xs p-2.5 bg-white dark:bg-zinc-900 border border-orange-100 dark:border-orange-950/20 rounded-lg flex flex-col gap-1">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-foreground">Row {item.row} &bull; Column: <span className="font-mono text-primary">{item.field}</span></span>
                              <span className="text-orange-500 font-bold">{item.confidence}% Confidence</span>
                            </div>
                            <div className="text-muted-foreground mt-0.5">
                              Suggested: <span className="font-bold text-foreground">"{item.suggestedValue}"</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground italic mt-0.5">
                              Reason: {item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats list cards */}
                  <div className="grid grid-cols-3 gap-3.5 w-full text-left">
                    <div className="p-3 bg-muted/40 dark:bg-zinc-900/50 rounded-xl border border-border dark:border-zinc-805 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Records</span>
                      <span className="block font-bold text-base text-foreground mt-0.5">
                        {finalData.statistics.importedCount.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-muted/40 dark:bg-zinc-900/50 rounded-xl border border-border dark:border-zinc-805 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Columns</span>
                      <span className="block font-bold text-base text-foreground mt-0.5">
                        {headers.length}
                      </span>
                    </div>

                    <div className="p-3 bg-muted/40 dark:bg-zinc-900/50 rounded-xl border border-border dark:border-zinc-805 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Batches</span>
                      <span className="block font-bold text-base text-foreground mt-0.5">
                        {totalBatches}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleFinalize}
                    className="w-full mt-2 h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    <span>Proceed to Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : !file ? (
                /* Empty Upload State */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "group flex flex-col items-center justify-center min-h-[320px] border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200",
                    dragActive
                      ? "border-primary bg-primary/5 scale-[0.99]"
                      : "border-border dark:border-zinc-800 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-muted/40 dark:hover:bg-zinc-900/30"
                  )}
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-primary border border-orange-100 dark:border-orange-900/30 group-hover:scale-105 transition-transform duration-200 shadow-sm mb-4">
                    <Upload className="w-6 h-6" />
                  </div>

                  <h4 className="font-bold text-lg text-foreground mb-1">
                    Drop your CSV file here
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    or <span className="text-primary font-medium hover:underline">click to browse files</span>
                  </p>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6">
                    Supported: CSV | Max 25 MB
                  </div>

                  <p className="text-xs text-muted-foreground max-w-lg leading-relaxed text-center">
                    Supports Facebook Leads, Google Ads exports, Excel sheets, Real Estate CRMs, Sales reports, and custom CSVs. Our AI automatically detects and maps your columns.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadSample()
                    }}
                    className="mt-6 gap-2 rounded-xl h-10 border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold hover:bg-muted dark:hover:bg-zinc-800 text-xs shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample CSV
                  </Button>
                </div>
              ) : (
                /* Selected File Preview Dashboard */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 text-left animate-in fade-in duration-200"
                >
                  {/* Summary KPI Metadata Grid */}
                  <SummaryCards
                    fileName={file.name}
                    fileSize={file.size}
                    rowCount={data.length}
                    colCount={headers.length}
                    timestamp={timestamp}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Inspector, Search & Grid */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Search Bar */}
                      <div className="flex items-center justify-between gap-4">
                        <SearchBar value={searchTerm} onChange={setSearchTerm} />
                      </div>

                      {/* Column Chips Inspector */}
                      {analysis && (
                        <ColumnInspector
                          columns={analysis.columnsInfo}
                          selectedColumn={selectedColumn}
                          onSelectColumn={setSelectedColumn}
                        />
                      )}

                      {/* Virtualized Table Preview */}
                      <PreviewTable
                        data={filteredData}
                        headers={headers}
                        selectedColumn={selectedColumn}
                        searchTerm={searchTerm}
                      />
                    </div>

                    {/* Right: Heuristics Quality Box & Schema Detected */}
                    <div className="lg:col-span-4 space-y-6">
                      {analysis && <DataQualityCard analysis={analysis} />}
                      {analysis && <DetectedStructure columns={analysis.columnsInfo} sampleData={data} />}
                    </div>
                  </div>
                </motion.div>
              )}

              {parseError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs font-bold text-left">
                  <span>Error parsing CSV: {parseError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {uploadState !== "uploading" && uploadState !== "processing" && uploadState !== "done" && (
              <div className="px-8 py-5 border-t border-border dark:border-[#2E2E33] bg-muted/40 dark:bg-zinc-900/30 flex items-center justify-between shrink-0">
                <Button
                  variant="outline"
                  onClick={file ? handleReplace : handleModalClose}
                  className="h-10 px-5 rounded-xl border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold hover:bg-muted dark:hover:bg-zinc-800 text-sm shadow-xs cursor-pointer"
                >
                  {file ? "Replace File" : "Cancel"}
                </Button>
                <Button
                  disabled={!file}
                  onClick={handleConfirm}
                  className="h-10 px-5 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white disabled:opacity-50 shadow-sm cursor-pointer disabled:cursor-not-allowed text-sm"
                >
                  Confirm Import
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
